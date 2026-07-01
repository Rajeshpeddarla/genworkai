import { NextResponse } from 'next/server';
import { db } from '@/db';
import { quizAttempts, quizAttemptAnswers, quizzes } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const persona = searchParams.get('persona');

    // Fetch attempts for the user
    const attempts = await db.select({
      attempt: quizAttempts,
      quiz: {
        title: quizzes.title,
        description: quizzes.description,
        rules: quizzes.rules
      }
    })
    .from(quizAttempts)
    .innerJoin(quizzes, eq(quizAttempts.quizId, quizzes.id))
    .where(eq(quizAttempts.userId, user.id))
    .orderBy(desc(quizAttempts.createdAt));

    const filteredAttempts = persona 
      ? attempts.filter(a => {
          const rules = a.quiz.rules as any;
          return rules?.persona === persona || (!rules?.persona && persona === 'General');
        })
      : attempts;

    return NextResponse.json({ attempts: filteredAttempts });
  } catch (error: any) {
    console.error('Fetch attempts error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const { quizId, score, totalMarks, answers, warningsCount, timeSpentMs } = await req.json();

    if (!quizId) {
      return NextResponse.json({ error: 'quizId is required' }, { status: 400 });
    }

    // Insert the attempt
    const [attempt] = await db.insert(quizAttempts).values({
      userId: user.id,
      quizId,
      status: 'submitted',
      score: score.toString(),
      totalMarks: totalMarks.toString(),
      warningsCount,
      finishedAt: new Date()
    }).returning();

    // Insert the answers if provided
    if (answers && answers.length > 0) {
      if (!attempt) {
        throw new Error('Failed to create quiz attempt');
      }
      
      const answersToInsert = answers.map((ans: any) => ({
        attemptId: attempt.id,
        questionId: ans.questionId,
        userAnswer: ans.userAnswer,
        status: ans.status || 'answered',
        isCorrect: ans.isCorrect
      }));
      await db.insert(quizAttemptAnswers).values(answersToInsert);
    }

    return NextResponse.json({ success: true, attemptId: attempt?.id });
  } catch (error: any) {
    console.error('Submit attempt error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
