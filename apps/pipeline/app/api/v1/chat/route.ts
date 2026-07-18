import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Client } from "pg";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { messages, documentId, documentText } = await request.json();

    if (!messages) {
      return NextResponse.json({ error: "Messages are required" }, { status: 400 });
    }

    let context = "";

    // V3: Hybrid RAG Intelligence
    // If a documentId is provided, perform a semantic search to fetch relevant chunks instead of dumping the whole raw text
    if (documentId) {
       const connectionString = process.env.DATABASE_URL;
       if (connectionString) {
          const client = new Client({ connectionString });
          await client.connect();
          
          // Get the user's latest question to search
          const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop();
          const query = lastUserMessage?.content || "";

          if (query) {
             // 1. Embed query
             const embedRes = await ai.models.embedContent({
               model: "text-embedding-004",
               contents: query,
             });
             const queryVector = embedRes.embeddings?.[0]?.values;

             // 2. Fetch top 5 chunks
             if (queryVector) {
                const searchResult = await client.query(`
                  SELECT content, metadata, 1 - (embedding <=> $1::vector) as similarity
                  FROM baseparse_embeddings
                  WHERE user_id = $2 AND document_id = $3
                  ORDER BY embedding <=> $1::vector
                  LIMIT 5
                `, [`[${queryVector.join(',')}]`, user.id, documentId]);

                context = searchResult.rows.map(r => r.content).join("\n\n---\n\n");
             }
          }
          await client.end();
       }
    } 
    
    // Fallback to legacy full text if no documentId provided but raw text is
    if (!context && documentText) {
       context = documentText.substring(0, 30000);
    }

    const systemInstruction = `You are a BaseParse Intelligence Agent analyzing a document. Answer the user's questions based ONLY on the provided context retrieved from the document. 
If the user asks for images, charts, or mathematical formulas, use the context provided.

Retrieved Document Context:
${context}
`;

    // Format history for Google Gen AI
    const contents = messages.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction,
      }
    });

    return NextResponse.json({ 
      content: response.text 
    });

  } catch (error: any) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
