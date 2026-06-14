import { NextResponse } from 'next/server';
import { db } from '../../../../../../db';
import { businessFeatures } from '../../../../../../db/schema';
import { eq } from 'drizzle-orm';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    const { nodeId, name, type, currentDesc } = await req.json();

    if (!nodeId || !name) {
      return NextResponse.json({ error: 'Node ID and Name are required' }, { status: 400, headers: corsHeaders });
    }

    const apiKey = process.env.CKEY_API_KEY;
    const apiUrl = process.env.CKEY_API_URL || 'https://ckey.vn/v1/chat/completions';

    if (!apiKey) {
      return NextResponse.json({ error: 'CKEY_API_KEY is missing' }, { status: 500, headers: corsHeaders });
    }

    const systemPrompt = `You are a Principal Technical Architect at GenWorkAI.
The user wants a deep, comprehensive technical explanation of a specific architectural node.

Node Name: "${name}"
Type: ${type}
Current short description: ${currentDesc}

Generate a highly detailed Markdown response explaining:
1. **Core Mechanism**: How does this actually work under the hood? What are the precise technical steps?
2. **Data Flow**: What data goes in, and what comes out?
3. **Integration Points**: How does this connect to other potential system components?
4. **Edge Cases & Error Handling**: What can go wrong and how should the system handle it?

Use rich Markdown formatting (bullet points, bold text, code blocks if necessary) to make it highly readable and professional. Output RAW MARKDOWN ONLY. Do not wrap in JSON. Make it at least 3-4 comprehensive paragraphs.`;

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-v4-flash',
        messages: [{ role: 'system', content: systemPrompt }],
        temperature: 0.4,
      })
    });

    if (!res.ok) {
       throw new Error(`LLM API failed with status ${res.status}`);
    }

    const data = await res.json();
    const content = data.choices[0].message.content;

    // Update the DB so the deep explanation persists
    const idInt = parseInt(nodeId.replace('feat-', ''), 10);
    if (!isNaN(idInt)) {
        await db.update(businessFeatures)
          .set({ description: content })
          .where(eq(businessFeatures.id, idInt));
    }

    return NextResponse.json({ 
      success: true, 
      explanation: content 
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('Node Explain API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate explanation' }, { status: 500, headers: corsHeaders });
  }
}
