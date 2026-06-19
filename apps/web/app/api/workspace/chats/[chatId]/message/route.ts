import { NextResponse } from 'next/server';
import { db } from '../../../../../../db';
import { workspaceChats, workspaceMessages, workspaceArtifacts, workspaceArtifactVersions } from '../../../../../../db/schema';
import { eq, asc, sql } from 'drizzle-orm';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { requireUser, requireOwnership } from '../../../../../../lib/auth';
import { RateLimitService } from '../../../../../../lib/security/rate-limit';

export async function POST(req: Request, { params }: { params: Promise<{ chatId: string }> }) {
  try {
    const { user, error: authError } = await requireUser();
    if (authError) return authError;

    const rateLimitResponse = await RateLimitService.check(user.id, 'ai');
    if (rateLimitResponse) return rateLimitResponse;

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

    // If there is a KB, perform search
    if (chat.kbId) {
       const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
       const searchRes = await fetch(`${baseUrl}/api/knowledge/search`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
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

    let systemPrompt = `You are an intelligent AI assistant in a professional workspace acting as an operating system for generated assets. 
If the user asks you to create, generate, or modify a document, file, developer asset, or presentation, you MUST output a structured JSON block containing the artifacts.
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
You may also include normal conversational text outside the JSON block. Do not use generic placeholders.`;

    if (contextText) {
       systemPrompt += `\n\nYou have access to a knowledge base. Here is relevant context retrieved for the user's query:\n\n---\n${contextText}\n---\n\nBase your answer on the context provided.`;
    }

    const apiKey = process.env.CKEY_API_KEY;
    if (!apiKey) {
      // Provide a mock stream response for local testing if no key is present
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode("I am a simulated AI. Set CKEY_API_KEY to generate real documents."));
          controller.close();
        }
      });
      return new Response(stream, { headers: { "Content-Type": "text/plain" } });
    }

    const ckey = createOpenAI({
      apiKey,
      baseURL: process.env.CKEY_API_URL || "https://ckey.vn/v1",
    });

    const llmMessages: {role: "system"|"user"|"assistant", content: string}[] = [
      { role: "system", content: systemPrompt }
    ];
    
    // Add history (excluding the current user message because we already inserted it)
    for (const msg of previousMessages) {
      if (msg.id !== userMessage?.[0]?.id) {
         llmMessages.push({ role: msg.role as "user"|"assistant", content: msg.content });
      }
    }
    // Add current user message
    llmMessages.push({ role: "user", content });

    const result = streamText({
      model: ckey('deepseek-v4-flash'),
      messages: llmMessages,
      async onFinish({ text }) {
        try {
          // Parse artifacts from assistantContent
          let parsedArtifacts: any[] = [];
          const jsonBlockMatch = text.match(/```json\n([\s\S]*?)\n```/);
          if (jsonBlockMatch && jsonBlockMatch[1]) {
            try {
              const parsed = JSON.parse(jsonBlockMatch[1]);
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

        } catch (dbErr) {
           console.error("Error saving to DB during onFinish:", dbErr);
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
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

