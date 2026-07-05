import { NextResponse } from 'next/server';
import { db } from '../../../../../../db';
import { workspaceChats, workspaceMessages, workspaceArtifacts, workspaceArtifactVersions, knowledgeBases } from '../../../../../../db/schema';
import { eq, asc, sql } from 'drizzle-orm';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { streamText } from 'ai';
import { requireUser, requireOwnership } from '../../../../../../lib/auth';
import { RateLimitService } from '../../../../../../lib/security/rate-limit';
import { EntitlementEngine } from '../../../../../../lib/billing/entitlements';
import { CreditService } from '../../../../../../lib/billing/CreditService';

export async function POST(req: Request, { params }: { params: Promise<{ chatId: string }> }) {
  let usageId: number | undefined;
  try {
    const { user, error: authError } = await requireUser();
    if (authError) return authError;

    const rateLimitResponse = await RateLimitService.check(user.id, 'ai');
    if (rateLimitResponse) return rateLimitResponse;

    const idempotencyKey = req.headers.get('x-idempotency-key') || crypto.randomUUID();
    
    // Check if user has BYOK entitlement enabled and actually provided a key (assuming platform by default for now unless we add that logic)
    const isByok = false; // TODO: Check user profile for custom API key

    const reserveResult = await CreditService.reserve(user.id, 'workspace_chat', {
      requestId: idempotencyKey,
      isByok,
      billingMode: isByok ? 'byok' : 'platform'
    });
    
    if (!reserveResult.success) {
      return NextResponse.json({ 
        error: reserveResult.reason || "Insufficient AI Credits.",
        code: reserveResult.errorType || 'INSUFFICIENT_AI_CREDITS'
      }, { status: 403 });
    }

    usageId = reserveResult.usageId;

    const resolvedParams = await params;
    const chatId = parseInt(resolvedParams.chatId);
    if (isNaN(chatId)) {
      return NextResponse.json({ error: "Invalid chat ID" }, { status: 400 });
    }

    const ownershipError = await requireOwnership('chat', chatId, user.id);
    if (ownershipError) return ownershipError;

    const { content } = await req.json();
    if (!content) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    const chat = await db.query.workspaceChats.findFirst({
      where: eq(workspaceChats.id, chatId)
    });

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Save User Message
    const userMessage = await db.insert(workspaceMessages).values({
      chatId,
      role: 'user',
      content,
    }).returning();

    // Fetch previous messages for context
    const previousMessages = await db.select()
      .from(workspaceMessages)
      .where(eq(workspaceMessages.chatId, chatId))
      .orderBy(asc(workspaceMessages.createdAt));

    let contextText = "";
    let kbName: string | null = null;

    // If there is a KB, perform search
    if (chat.kbId) {
       const kb = await db.query.knowledgeBases.findFirst({
         where: eq(knowledgeBases.id, chat.kbId)
       });
       if (kb) kbName = kb.name;

       const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
       const cookieHeader = req.headers.get('cookie');
       const searchRes = await fetch(`${baseUrl}/api/knowledge/search`, {
         method: 'POST',
         headers: { 
           'Content-Type': 'application/json',
           ...(cookieHeader ? { 'cookie': cookieHeader } : {})
         },
         body: JSON.stringify({ query: content, kbId: chat.kbId.toString() })
       });

       if (searchRes.ok) {
         const searchData = await searchRes.json();
         if (searchData.results && searchData.results.length > 0) {
            contextText = searchData.results.map((r: any, idx: number) => {
              const srcStr = typeof r.sourceContent === 'string' ? r.sourceContent.substring(0, 800) : "N/A";
              const knowStr = typeof r.knowledgeContent === 'string' ? r.knowledgeContent.substring(0, 800) : "N/A";
              return `--- RETRIEVED DOCUMENT ${idx + 1} ---
### Title: ${r.documentTitle}

**Original Source Snippet:**
${srcStr}...

**Knowledge Summary (AI Generated):**
${knowStr}...

**Relevant Extracted Excerpt (Search Match):**
${r.content}`;
            }).join("\n\n");
         }
       }
    }

    let systemPrompt = `You are an intelligent AI assistant in a professional workspace.
If the user asks a question, requests an explanation, or asks for information, provide your answer as normal conversational text using standard Markdown. Do NOT use smart quotes (use standard ASCII ' and "). Do NOT wrap conversational answers in a JSON artifact block.

If (and ONLY if) the user explicitly asks you to create, generate, write, or modify a document, file, developer asset, or presentation, you MUST output a structured JSON block containing the artifacts.
Enclose the artifacts in a \`\`\`json block with the following schema:
{
  "artifacts": [
    {
      "name": "Filename with extension (e.g., SOP.md, schema.sql, api.json)",
      "fileType": "md | json | sql | csv | txt | html", 
      "category": "Document | Code | Presentation | Data | Developer Asset",
      "content": "The actual full content of the file. For markdown, use proper # headers, tables, etc.",
      "isNew": true,
      "existingArtifactId": null
    }
  ]
}
Do not use generic placeholders in generated code or text.

CRITICAL RULES FOR FACTUAL ACCURACY AND CODE GENERATION:
1. NEVER invent, hallucinate, or guess package names, dependencies, or APIs.
2. If you are unsure whether a package or API exists (e.g., on pub.dev, npm, pip, PyPI), you MUST admit you do not know or strongly warn the user to verify it. Do NOT make up names that sound correct (e.g. sentry_replay).
3. If you make a correction to a previous mistake, make sure the generated artifact itself reflects the most accurate and correct instructions without including your apology inside the code/artifact contents.`;

    if (chat.kbId && kbName) {
       systemPrompt += `\n\nCRITICAL CONTEXT INSTRUCTION: You are STRICTLY grounded to the Knowledge Base named "${kbName}". You MUST interpret all user queries within the context of "${kbName}". If a term is ambiguous (e.g. "builder", "controller"), assume the user is asking about it in the context of "${kbName}", NOT general programming frameworks like Flutter, React, etc., unless they explicitly specify otherwise.`;
       if (contextText) {
          systemPrompt += `\n\nHere is the relevant retrieved context from "${kbName}" for the user's query:\n\n---\n${contextText}\n---\n\nBase your answer heavily on the context provided.`;
       } else {
          systemPrompt += `\n\nNOTE: A search was performed against the Knowledge Base "${kbName}", but no specific snippets matched. You must still answer strictly within the context of "${kbName}" if possible. If the query makes no sense in the context of "${kbName}", ask the user for clarification.`;
       }
    } else if (contextText) {
       systemPrompt += `\n\nYou have access to a knowledge base. Here is relevant context retrieved for the user's query:\n\n---\n${contextText}\n---\n\nBase your answer on the context provided.`;
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      // Provide a mock stream response for local testing if no key is present
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode("I am a simulated AI. Set DEEPSEEK_API_KEY to generate real documents."));
          controller.close();
        }
      });
      return new Response(stream, { headers: { "Content-Type": "text/plain" } });
    }

    const deepseek = createDeepSeek({
      apiKey,
      baseURL: process.env.DEEPSEEK_API_URL || "https://api.deepseek.com",
    });

    const llmMessages: {role: "user"|"assistant", content: string}[] = [];
    
    // Add history (excluding the current user message because we already inserted it)
    for (const msg of previousMessages) {
      if (msg.id !== userMessage?.[0]?.id) {
         llmMessages.push({ role: msg.role as "user"|"assistant", content: msg.content });
      }
    }
    // Add current user message
    llmMessages.push({ role: "user", content });

    const result = streamText({
      model: deepseek.chat('deepseek-v4-flash'),
      system: systemPrompt,
      messages: llmMessages,
      async onFinish({ text, usage }) {
        try {
          let parsedArtifacts: any[] = [];
          let jsonString: string | null = null;

          const blockRegex = /```(?:[a-zA-Z]*)\r?\n([\s\S]*?)\r?\n```/g;
          let match;
          while ((match = blockRegex.exec(text)) !== null) {
            const blockContent = match[1]?.trim() || "";
            if (blockContent.startsWith('{') && blockContent.includes('"artifacts"')) {
              jsonString = blockContent;
              break;
            }
          }

          if (!jsonString) {
            const startIdx = text.search(/\{\s*"artifacts"/);
            if (startIdx !== -1) {
              const endIdx = text.lastIndexOf('}');
              if (endIdx > startIdx) {
                jsonString = text.substring(startIdx, endIdx + 1);
              }
            }
          }

          if (jsonString) {
            try {
              const parsed = JSON.parse(jsonString);
              if (parsed.artifacts && Array.isArray(parsed.artifacts)) {
                parsedArtifacts = parsed.artifacts;
              }
            } catch(e) {
              console.error("Failed to parse LLM JSON artifacts:", e);
            }
          }

          // Save Artifacts to DB
          for (const art of parsedArtifacts) {
            if (art.isNew || !art.existingArtifactId) {
              const newArt = await db.insert(workspaceArtifacts).values({
                  chatId,
                  name: art.name || 'Untitled Document',
                  fileType: art.fileType || 'txt',
                  category: art.category || 'Document',
                  status: 'final'
              }).returning();
              
              if (newArt && newArt.length > 0 && newArt[0]) {
                await db.insert(workspaceArtifactVersions).values({
                    artifactId: newArt[0].id,
                    versionNumber: 1,
                    content: art.content || ''
                });
              }
            } else {
              const existing = await db.select().from(workspaceArtifacts).where(eq(workspaceArtifacts.id, art.existingArtifactId));
              if (existing && existing.length > 0 && existing[0]) {
                  const existingArt = existing[0];
                  const maxV = await db.execute(sql`SELECT COALESCE(MAX(version_number), 0) as max_v FROM workspace_artifact_versions WHERE artifact_id = ${existingArt.id}`);
                  let nextVersion = 1;
                  if (maxV && maxV.rows && maxV.rows.length > 0 && maxV.rows[0]) {
                    nextVersion = (maxV.rows[0].max_v as number) + 1;
                  }
                  
                  await db.insert(workspaceArtifactVersions).values({
                    artifactId: existingArt.id,
                    versionNumber: nextVersion,
                    content: art.content || ''
                  });
                  await db.update(workspaceArtifacts).set({ updatedAt: new Date() }).where(eq(workspaceArtifacts.id, existingArt.id));
              }
            }
          }

          // Save Assistant Message
          await db.insert(workspaceMessages).values({
            chatId,
            role: 'assistant',
            content: text,
          });

          await db.update(workspaceChats)
            .set({ updatedAt: new Date() })
            .where(eq(workspaceChats.id, chatId));


          if (usageId) {
            await CreditService.finalize(usageId, {
              inputTokens: (usage as any)?.promptTokens || 0,
              outputTokens: (usage as any)?.completionTokens || 0,
              provider: 'deepseek',
              model: 'deepseek-v4-flash'
            });
          }

        } catch (dbErr) {
           console.error("Error saving to DB during onFinish:", dbErr);
           if (usageId) await CreditService.refund(usageId, "DB Save Error during onFinish");
        }
      }
    });

    // We return a raw text stream here. 
    // We add a custom header so the frontend knows if context was used.
    const response = result.toTextStreamResponse();
    response.headers.set('x-context-used', contextText ? 'true' : 'false');
    return response;

  } catch (error: any) {
    console.error("Failed to process message:", error);
    if (usageId) {
      await CreditService.refund(usageId, error.message || "Failed to start processing message");
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

