import { NextResponse } from 'next/server';
import { generateWithFallbacks, TaskCategory } from '@repo/ai';
import { requireUser } from '../../../../lib/auth';
import { RateLimitService } from '../../../../lib/security/rate-limit';

export async function POST(req: Request) {
  try {
    const { user, error: authError } = await requireUser();
    if (authError) return authError;

    const rateLimitResponse = await RateLimitService.check(user.id, 'ai');
    if (rateLimitResponse) return rateLimitResponse;

    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      // Mocked fallback if no API key is provided
      return NextResponse.json({
        success: true,
        data: JSON.stringify({
          name: "Mock API Endpoint",
          slug: "mock-api-endpoint",
          method: "POST",
          steps: [
            "Parse Request JSON (Input Schema)",
            "Retrieve Knowledge (RAG)",
            "LLM Processing (System Prompt)",
            "Format Response JSON (Output Schema)"
          ]
        })
      });
    }

    const systemPrompt = `You are an expert API architect. The user wants to build an API endpoint. 
Based on their prompt, generate a JSON object representing the endpoint workflow.
The JSON must have the following schema exactly:
{
  "name": "A short, descriptive name (e.g. Study Plan Generator)",
  "slug": "url-friendly-slug (e.g. study-plan-generator)",
  "method": "GET or POST or PUT or DELETE",
  "steps": ["Step 1 description", "Step 2 description", ...]
}
Output ONLY valid JSON. Do not include markdown blocks like \`\`\`json.`;

    const result = await generateWithFallbacks({
      system: systemPrompt,
      messages: [
        { role: "user", content: prompt }
      ],
      taskCategory: TaskCategory.STRUCTURED,
      responseFormatJson: true
    }, apiKey, process.env.DEEPSEEK_API_URL);

    // If it wrapped in markdown blocks, strip them
    let cleanedContent = result.content.trim();
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.substring(7);
      if (cleanedContent.endsWith('```')) {
        cleanedContent = cleanedContent.substring(0, cleanedContent.length - 3);
      }
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.substring(3);
      if (cleanedContent.endsWith('```')) {
        cleanedContent = cleanedContent.substring(0, cleanedContent.length - 3);
      }
    }
    
    return NextResponse.json({ success: true, data: cleanedContent.trim() });
  } catch (error: any) {
    console.error("API Builder Gen Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
