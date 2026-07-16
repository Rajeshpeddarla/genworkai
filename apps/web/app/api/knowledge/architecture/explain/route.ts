import { NextResponse } from 'next/server';
import { generateWithFallbacks, TaskCategory } from '@repo/ai';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    const { kbId, nodeData } = await req.json();

    if (!kbId || !nodeData) {
      return NextResponse.json({ error: 'kbId and nodeData are required' }, { status: 400, headers: corsHeaders });
    }

    const systemPrompt = `
You are an expert software architect.
You are tasked with explaining the role of a specific component in an application's architecture.

Component Name: ${nodeData.label}
Component Type: ${nodeData.type}
Source Path: ${nodeData.source}
Basic Summary: ${nodeData.summary || 'None'}
Dependencies / Relationships: ${JSON.stringify(nodeData.relationships || [])}

Please provide a detailed, highly technical but readable explanation (about 2 paragraphs) of:
1. What this component likely does based on its name and type.
2. How it fits into the broader system architecture based on its dependencies and relationships.

Write the response in clean Markdown.
`;

    const result = await generateWithFallbacks({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Explain the architectural role of ${nodeData.label}` }
      ],
      maxTokens: 1000,
      temperature: 0.3,
    }, process.env.GEMINI_API_KEY || '');

    return NextResponse.json({ 
      success: true, 
      explanation: result.content
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('Architecture Explain API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to explain node' }, { status: 500, headers: corsHeaders });
  }
}
