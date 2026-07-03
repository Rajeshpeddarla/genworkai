import { NextResponse } from 'next/server';
import { db } from '@/db';
import { eq, inArray } from 'drizzle-orm';
import { documents } from '@/db/schema';
import { quizzes, quizQuestions } from '@/db/schema';
import { requireUser } from '@/lib/auth';
import { z } from 'zod';
import { CreditService } from '@/lib/billing/CreditService';

export async function POST(req: Request) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const { kbId, scope, config, rules } = await req.json();

    const reserveResult = await CreditService.reserve(user.id, 'quiz_generation', {
      multiplier: config.count,
      artifactType: 'quiz'
    });

    if (!reserveResult.success) {
      return NextResponse.json({ error: reserveResult.reason || 'Insufficient Credits' }, { status: 402 });
    }

    try {
      // 1. Fetch Context from KB
    let docs: any[] = [];
    if (kbId) {
      if (scope.type === 'entire_kb') {
        docs = await db.select().from(documents).where(eq(documents.kbId, kbId));
      } else {
        // Fallback to entire KB for now if specific selection logic isn't fully robust
        docs = await db.select().from(documents).where(eq(documents.kbId, kbId));
      }
    }

    const contextText = docs.map((d: any) => `Title: ${d.title}\n\nContent: ${d.knowledgeContent || d.content}`).join('\n\n---NEXT_DOC---\n\n').substring(0, 100000);

    // 2. Define the schema for the AI output
    const questionSchema = z.object({
      questions: z.array(z.object({
        type: z.enum(['multiple_choice', 'true_false', 'short_answer', 'theory']),
        difficulty: z.enum(['Beginner', 'Medium', 'Hard', 'Expert']),
        bloomLevel: z.enum(['Remembering', 'Understanding', 'Applying', 'Analyzing', 'Evaluating', 'Creating']),
        questionText: z.string().describe('The actual question to ask.'),
        options: z.array(z.string()).optional().describe('Options for multiple_choice. Omit for theory/short_answer.'),
        correctAnswer: z.string().describe('The exact correct answer or ideal answer for theory.'),
        explanation: z.string().describe('Detailed explanation of why the answer is correct.'),
        referenceFile: z.string().optional().describe('Title of the document where this was found.')
      }))
    });

    const promptText = `
You are an expert curriculum designer and examiner.
Generate exactly ${config.count} questions.
Target Difficulty: ${config.difficulty}.
Target Bloom's Level: ${config.bloomLevel !== 'Mixed' ? config.bloomLevel : 'A mix of all levels'}.
Allowed Question Types: ${config.questionTypes.join(', ')}.

Context Information:
${contextText || "No context provided. Use general knowledge about " + (scope.value || "the topic")}

Ensure every question is highly accurate, challenging but fair, and traceable to the provided context if available.
`;

    // 3. Generate structured JSON using DeepSeek via direct fetch
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-v4-flash",
        messages: [
          { role: "system", content: "You MUST return ONLY valid JSON matching the exact schema. DO NOT wrap it in markdown." },
          { role: "user", content: promptText + `\n\nReturn EXACTLY this JSON schema structure:\n{ "questions": [ { "type": "multiple_choice|true_false|short_answer|theory", "difficulty": "Beginner|Medium|Hard|Expert", "bloomLevel": "Remembering|Understanding|Applying|Analyzing|Evaluating|Creating", "questionText": "string", "options": ["string"], "correctAnswer": "string", "explanation": "string", "referenceFile": "string" } ] }` }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`DeepSeek API error: ${err}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content;
    
    // Clean up markdown block if present
    if (content.startsWith('```json')) {
      content = content.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (content.startsWith('```')) {
      content = content.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }
    const object = JSON.parse(content);

    // 4. Save to Database
    const [newQuiz] = await db.insert(quizzes).values({
      userId: user.id,
      kbId: kbId || null,
      title: scope.value ? `Quiz on ${scope.value}` : 'Generated Assessment',
      description: `A ${config.difficulty} level quiz focusing on ${config.bloomLevel}.`,
      rules,
      scope,
      status: 'draft',
      estimatedCredits: config.count * 2
    }).returning();

    if (!newQuiz) {
      throw new Error('Failed to create new quiz');
    }

    const questionsToInsert = object.questions.map((q: any, index: number) => ({
      quizId: newQuiz.id,
      type: q.type,
      difficulty: q.difficulty,
      bloomLevel: q.bloomLevel,
      questionText: q.questionText,
      options: q.options || [],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      referenceFile: q.referenceFile,
      orderIndex: index
    }));

    await db.insert(quizQuestions).values(questionsToInsert);

    if (reserveResult.usageId) {
      await CreditService.finalize(reserveResult.usageId);
    }

    return NextResponse.json({ success: true, quizId: newQuiz.id });
    } catch (innerError: any) {
      if (reserveResult.usageId) {
        await CreditService.refund(reserveResult.usageId, innerError.message);
      }
      throw innerError;
    }
  } catch (error: any) {
    console.error('Quiz generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

