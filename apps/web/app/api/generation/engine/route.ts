import { NextResponse } from 'next/server';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { documents, automationOutputs, automationOutputVersions } from '@/db/schema';
import { requireUser } from '@/lib/auth';
import { CreditService } from '@/lib/billing/CreditService';
import { generateText, generateObject } from 'ai';
import { z } from 'zod';
import { createDeepSeek } from '@ai-sdk/deepseek';

export async function POST(req: Request) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const { module, template, prompt, kbId, configuration } = await req.json();

    // Calculate credits based on module
    let operationKey = 'document_generation';
    let multiplier = 1;

    if (module === 'Study Center' || module === 'Notes Center' || module === 'Summary Center') {
      operationKey = 'summary_generation';
    } else if (module === 'Lesson Planner' || module === 'Question Papers') {
      operationKey = 'document_generation';
    } else if (module === 'Repository Center' || module === 'Documentation Center') {
      operationKey = 'architecture_generation';
    } else if (module === 'Dashboard Center' || module === 'Analytics Center') {
      operationKey = 'document_generation';
    }

    // Reserve credits
    const reserveResult = await CreditService.reserve(user.id, operationKey, {
      multiplier,
      artifactType: module
    });

    if (!reserveResult.success) {
      return NextResponse.json({ error: reserveResult.reason || 'Insufficient Credits' }, { status: 402 });
    }

    try {
      // 1. Fetch Context from KB
      let contextText = '';
      if (kbId) {
        const docs = await db.select().from(documents).where(eq(documents.kbId, kbId));
        contextText = docs.map((d: any) => `Title: ${d.title}\n\nContent: ${d.knowledgeContent || d.content}`).join('\n\n---NEXT_DOC---\n\n').substring(0, 50000); // Limit context
      }

      // 2. Build Prompt based on module and configuration
      const systemPrompt = `You are an expert AI assistant operating within the ${module} module. 
Your goal is to generate a high-quality "${template}" output.
Follow the user's prompt strictly. Ensure professional formatting. Use markdown unless specified otherwise.
Configuration provided: ${JSON.stringify(configuration)}`;

      const userPrompt = `
Task: ${prompt}

Context Information:
${contextText || "No context provided. Use general knowledge."}

Generate the final output now.
`;

      const deepseek = createDeepSeek({
        apiKey: process.env.GEMINI_API_KEY || '',
      });

      let finalContent = '';
      let outputFormat = 'markdown';
      let usageResult;

      if (template === 'Flashcards') {
        const schema = z.object({
          topic: z.string(),
          cards: z.array(z.object({
            question: z.string(),
            answer: z.string(),
            difficulty: z.enum(['easy', 'medium', 'hard']),
            explanation: z.string(),
            references: z.array(z.string())
          }))
        });

        const { object, usage } = await generateObject({
          model: deepseek('deepseek-v4-flash'),
          system: systemPrompt,
          prompt: userPrompt,
          schema: schema,
        });

        finalContent = JSON.stringify(object);
        outputFormat = 'flashcards_v1';
        usageResult = usage;
      } else if (template === 'Detailed Notes' || template === 'Revision Notes') {
        const schema = z.object({
          title: z.string(),
          summary: z.string(),
          sections: z.array(z.object({
            heading: z.string(),
            content: z.string(),
            keyTerms: z.array(z.string()),
            importantHighlights: z.array(z.string())
          }))
        });

        const { object, usage } = await generateObject({
          model: deepseek('deepseek-v4-flash'),
          system: systemPrompt,
          prompt: userPrompt,
          schema: schema,
        });

        finalContent = JSON.stringify(object);
        outputFormat = 'study_notes_v1';
        usageResult = usage;
      } else {
        const { text, usage } = await generateText({
          model: deepseek('deepseek-v4-flash'),
          system: systemPrompt,
          prompt: userPrompt,
        });
        
        finalContent = text;
        outputFormat = 'markdown';
        usageResult = usage;
      }

      // 3. Save to Database
      const title = configuration.title || prompt.substring(0, 50) + '...';

      const [newOutput] = await db.insert(automationOutputs).values({
        userId: user.id,
        kbId: kbId || null,
        module,
        template,
        title,
        status: 'completed',
        creditsUsed: reserveResult.reservedCredits || 0,
        provider: 'deepseek',
        billingMode: 'platform'
      }).returning();
      if (!newOutput) {
        throw new Error('Failed to insert automation output');
      }

      await db.insert(automationOutputVersions).values({
        outputId: newOutput.id,
        versionNumber: 1,
        content: finalContent,
        format: outputFormat
      });

      // 4. Finalize Credits
      if (reserveResult.usageId) {
        await CreditService.finalize(reserveResult.usageId);
      }

      return NextResponse.json({ success: true, outputId: newOutput?.id, content: finalContent });
    } catch (innerError: any) {
      // Refund on failure
      if (reserveResult.usageId) {
        await CreditService.refund(reserveResult.usageId, innerError.message);
      }
      throw innerError;
    }
  } catch (error: any) {
    console.error('Generation Engine error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
