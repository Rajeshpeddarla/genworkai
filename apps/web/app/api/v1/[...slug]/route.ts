import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { apiEndpoints, knowledgeBases } from '../../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireUser } from '../../../../lib/auth';
import { safeErrorResponse } from '../../../../lib/errors';
import { generateWithFallbacks, streamWithFallbacks, TaskCategory } from '@repo/ai';
import { RateLimitService } from '../../../../lib/security/rate-limit';

export const dynamic = 'force-dynamic';

async function performKBSearch(query: string, kbId: string, req: Request) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const cookieHeader = req.headers.get('cookie');
  const searchRes = await fetch(`${baseUrl}/api/knowledge/search`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(cookieHeader ? { 'cookie': cookieHeader } : {})
    },
    body: JSON.stringify({ query, kbId })
  });

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.results && searchData.results.length > 0) {
      return searchData.results.map((r: any, idx: number) => {
        return `[Source ${idx + 1}: ${r.documentTitle} (${r.sourceType})]
---
${r.content}
---`;
      }).join('\n\n');
    }
  }
  return null;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const rateLimitResponse = await RateLimitService.check(user.id, 'default');
    if (rateLimitResponse) return rateLimitResponse;

    const resolvedParams = await params;
    const pathUserId = resolvedParams.slug?.[0];
    const entityTypeOrSlug = resolvedParams.slug?.[1];

    if (!pathUserId || !entityTypeOrSlug) {
      return NextResponse.json({ error: "Invalid API endpoint path" }, { status: 400 });
    }

    if (pathUserId !== user.id) {
      return NextResponse.json({ error: "Unauthorized access to user API" }, { status: 403 });
    }

    const payload = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    // Handle KB Query API
    if (entityTypeOrSlug === 'kb') {
      const kbIdStr = resolvedParams.slug?.[2];
      const isStream = resolvedParams.slug?.[3] === 'stream' || new URL(req.url).searchParams.get('stream') === 'true';

      if (!kbIdStr) return NextResponse.json({ error: "KB ID required" }, { status: 400 });

      const kb = await db.query.knowledgeBases.findFirst({
        where: and(eq(knowledgeBases.id, parseInt(kbIdStr)), eq(knowledgeBases.userId, user.id))
      });

      if (!kb) return NextResponse.json({ error: "Knowledge Base not found" }, { status: 404 });

      const queryText = payload.query || payload.text || JSON.stringify(payload);
      const contextText = await performKBSearch(queryText, kbIdStr, req);

      const systemPrompt = `You are a Knowledge Base AI representing "${kb.name}". 
${kb.description ? `Description: ${kb.description}` : ''}
Use the following retrieved context to answer the user's query accurately. 
If the answer is not in the context, do your best to answer or state that the context does not contain the answer.

<context>
${contextText || "No context found in the Knowledge Base for this query."}
</context>`;

      if (isStream) {
        const result = await streamWithFallbacks({
          system: systemPrompt,
          messages: [{ role: "user", content: queryText }],
          taskCategory: TaskCategory.REASONING,
        }, apiKey || "", undefined);
        return result.toTextStreamResponse();
      }

      const result = await generateWithFallbacks({
        system: systemPrompt,
        messages: [{ role: "user", content: queryText }],
        taskCategory: TaskCategory.REASONING,
      }, apiKey || "", undefined);
      
      return NextResponse.json({ response: result.content });
    }

    // Handle Custom API
    const apiSlug = entityTypeOrSlug;
    const [api] = await db.select()
      .from(apiEndpoints)
      .where(and(eq(apiEndpoints.userId, user.id), eq(apiEndpoints.slug, apiSlug)));

    if (!api) return NextResponse.json({ error: "API not found" }, { status: 404 });
    if (!api.isPublished) return NextResponse.json({ error: "API is not published" }, { status: 400 });

    if (!apiKey) {
      return NextResponse.json({ 
        success: true, 
        message: "Simulated execution (No DEEPSEEK_API_KEY provided)", 
        api_executed: api.name,
        payload_received: payload 
      });
    }

    const isStream = resolvedParams.slug?.[2] === 'stream' || new URL(req.url).searchParams.get('stream') === 'true';

    const systemPrompt = `You are a Custom REST API named "${api.name}".
Your task is to process the user's payload according to the following workflow steps:
${(api.workflow as string[] || []).map((step: string, i: number) => `${i + 1}. ${step}`).join('\n')}

Execute these steps and return the final response.${!isStream ? ' Do not include markdown blocks in your output, just raw JSON.' : ' You may stream markdown text directly as a response.'}`;

    if (isStream) {
      const result = await streamWithFallbacks({
        system: systemPrompt,
        messages: [{ role: "user", content: JSON.stringify(payload) }],
        taskCategory: TaskCategory.STRUCTURED,
      }, apiKey, undefined);
      return result.toTextStreamResponse();
    }

    const result = await generateWithFallbacks({
      system: systemPrompt,
      messages: [{ role: "user", content: JSON.stringify(payload) }],
      taskCategory: TaskCategory.STRUCTURED,
      responseFormatJson: true
    }, apiKey, undefined);

    let cleanedContent = result.content.trim();
    cleanedContent = cleanedContent.replace(/^```json\n/, '').replace(/^```\n/, '').replace(/\n```$/, '');

    try {
      const parsed = JSON.parse(cleanedContent);
      return NextResponse.json(parsed);
    } catch (e) {
      return NextResponse.json({ success: true, data: cleanedContent });
    }
  } catch (error: unknown) {
    return safeErrorResponse(error, 'Execute API Route (POST)');
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const rateLimitResponse = await RateLimitService.check(user.id, 'default');
    if (rateLimitResponse) return rateLimitResponse;

    const resolvedParams = await params;
    const pathUserId = resolvedParams.slug?.[0];
    const entityTypeOrSlug = resolvedParams.slug?.[1];

    if (!pathUserId || !entityTypeOrSlug) {
      return NextResponse.json({ error: "Invalid API endpoint path" }, { status: 400 });
    }

    if (pathUserId !== user.id) {
      return NextResponse.json({ error: "Unauthorized access to user API" }, { status: 403 });
    }

    const url = new URL(req.url);
    const payload = Object.fromEntries(url.searchParams.entries());
    const apiKey = process.env.GEMINI_API_KEY;

    // Handle KB Query API
    if (entityTypeOrSlug === 'kb') {
      const kbIdStr = resolvedParams.slug?.[2];
      const isStream = resolvedParams.slug?.[3] === 'stream' || url.searchParams.get('stream') === 'true';

      if (!kbIdStr) return NextResponse.json({ error: "KB ID required" }, { status: 400 });

      const kb = await db.query.knowledgeBases.findFirst({
        where: and(eq(knowledgeBases.id, parseInt(kbIdStr)), eq(knowledgeBases.userId, user.id))
      });

      if (!kb) return NextResponse.json({ error: "Knowledge Base not found" }, { status: 404 });

      const queryText = payload.query || payload.text || JSON.stringify(payload);
      const contextText = await performKBSearch(queryText, kbIdStr, req);

      const systemPrompt = `You are a Knowledge Base AI representing "${kb.name}". 
${kb.description ? `Description: ${kb.description}` : ''}
Use the following retrieved context to answer the user's query accurately. 
If the answer is not in the context, do your best to answer or state that the context does not contain the answer.

<context>
${contextText || "No context found in the Knowledge Base for this query."}
</context>`;

      if (isStream) {
        const result = await streamWithFallbacks({
          system: systemPrompt,
          messages: [{ role: "user", content: queryText }],
          taskCategory: TaskCategory.REASONING,
        }, apiKey || "", undefined);
        return result.toTextStreamResponse();
      }

      const result = await generateWithFallbacks({
        system: systemPrompt,
        messages: [{ role: "user", content: queryText }],
        taskCategory: TaskCategory.REASONING,
      }, apiKey || "", undefined);
      
      return NextResponse.json({ response: result.content });
    }

    // Handle Custom API
    const apiSlug = entityTypeOrSlug;
    const [api] = await db.select()
      .from(apiEndpoints)
      .where(and(eq(apiEndpoints.userId, user.id), eq(apiEndpoints.slug, apiSlug)));

    if (!api) return NextResponse.json({ error: "API not found" }, { status: 404 });
    if (!api.isPublished) return NextResponse.json({ error: "API is not published" }, { status: 400 });

    if (!apiKey) {
      return NextResponse.json({ 
        success: true, 
        message: "Simulated execution (No DEEPSEEK_API_KEY provided)", 
        api_executed: api.name,
        payload_received: payload 
      });
    }

    const isStream = resolvedParams.slug?.[2] === 'stream' || url.searchParams.get('stream') === 'true';

    const systemPrompt = `You are a Custom REST API named "${api.name}".
Your task is to process the user's request according to the following workflow steps:
${(api.workflow as string[] || []).map((step: string, i: number) => `${i + 1}. ${step}`).join('\n')}

Execute these steps and return the final response.${!isStream ? ' Do not include markdown blocks in your output, just raw JSON.' : ' You may stream markdown text directly as a response.'}`;

    if (isStream) {
      const result = await streamWithFallbacks({
        system: systemPrompt,
        messages: [{ role: "user", content: Object.keys(payload).length > 0 ? JSON.stringify(payload) : "Execute the workflow." }],
        taskCategory: TaskCategory.STRUCTURED,
      }, apiKey, undefined);
      return result.toTextStreamResponse();
    }

    const result = await generateWithFallbacks({
      system: systemPrompt,
      messages: [{ role: "user", content: Object.keys(payload).length > 0 ? JSON.stringify(payload) : "Execute the workflow." }],
      taskCategory: TaskCategory.STRUCTURED,
      responseFormatJson: true
    }, apiKey, undefined);

    let cleanedContent = result.content.trim();
    cleanedContent = cleanedContent.replace(/^```json\n/, '').replace(/^```\n/, '').replace(/\n```$/, '');

    try {
      const parsed = JSON.parse(cleanedContent);
      return NextResponse.json(parsed);
    } catch (e) {
      return NextResponse.json({ success: true, data: cleanedContent });
    }
  } catch (error: unknown) {
    return safeErrorResponse(error, 'Execute API Route (GET)');
  }
}
// Trigger rebuild
