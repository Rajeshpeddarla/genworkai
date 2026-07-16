import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const { query, context } = await req.json();

    if (!query || !context) {
      return NextResponse.json({ error: 'Query and context are required' }, { status: 400 });
    }

    const prompt = `
You are an intelligent data extraction assistant parsing a document.
Please answer the user's query based ONLY on the following extracted document content. 
If the answer is not in the document, say "I cannot find the answer in the provided document."

Document Content:
"""
${context}
"""

User Query: ${query}
`;

    const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
    });

    return NextResponse.json({ reply: response.text });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
