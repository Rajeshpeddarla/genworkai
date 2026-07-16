import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

    const { messages, documentText } = await request.json();

    if (!messages || !documentText) {
      return NextResponse.json({ error: "Messages and document context are required" }, { status: 400 });
    }

    const systemInstruction = `You are a helpful assistant analyzing a PDF document. Answer the user's questions based ONLY on the provided document text. If the user asks for images or visual charts, you can use markdown syntax to link to hypothetical or simulated image URLs if appropriate for the context, since we are in a testing phase.
    
Document Context:
${documentText.substring(0, 30000)} // limiting context for safety
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
