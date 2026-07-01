import { NextResponse } from 'next/server';

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
    const { name } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Flow name is required for generation' }, { status: 400, headers: corsHeaders });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    const apiUrl = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com';

    if (!apiKey) {
      console.warn("DEEPSEEK_API_KEY missing, falling back to mock generator");
      // Fallback mock if no API key
      const steps = [
        { stepName: 'User Request', description: '**Files:** `components/Form.tsx`\n\n**Methods:** `onSubmit()`\n\n**Explanation:** Captures user input.' },
        { stepName: 'API Endpoint', description: '**Files:** `api/route.ts`\n\n**Methods:** `POST()`\n\n**Explanation:** Receives request and authenticates.' },
        { stepName: 'Data Layer', description: '**Files:** `db/schema.ts`\n\n**Methods:** `db.insert()`\n\n**Explanation:** Saves to Postgres.' }
      ];
      return NextResponse.json({ success: true, description: `**Purpose:** AI Generated Flow for ${name}`, steps }, { headers: corsHeaders });
    }

    const systemPrompt = `You are an expert Software Architect. The user wants to design a technical workflow for the system.
The workflow is named: "${name}".

Generate a JSON object containing:
1. "description": A short Markdown paragraph explaining the purpose of this flow.
2. "steps": An array of EXACTLY 5 to 7 steps representing the technical execution of this flow.

For EACH step in the "steps" array, provide:
- "stepName": A 2-3 word title.
- "description": A highly detailed Markdown string formatted exactly like this:
  **Files:** \`path/to/file.ts\`
  
  **Methods:** \`methodName()\`
  
  **Explanation:** A 2-3 sentence explanation of the precise technical logic happening here, including data structures, context, and external API calls.

Return ONLY raw JSON matching this TypeScript interface:
{
  "description": string,
  "steps": { "stepName": string, "description": string }[]
}`;

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-v4-flash', // fast routing model
        messages: [{ role: 'system', content: systemPrompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })
    });

    if (!res.ok) {
       throw new Error(`LLM API failed with status ${res.status}`);
    }

    const data = await res.json();
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);

    return NextResponse.json({ 
      success: true, 
      description: parsed.description, 
      steps: parsed.steps 
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('Flow Generate API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate flow' }, { status: 500, headers: corsHeaders });
  }
}
