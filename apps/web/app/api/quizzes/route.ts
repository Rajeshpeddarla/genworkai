import { NextResponse } from 'next/server';
import { db } from '../../../db';
import { quizzes, quizQuestions } from '../../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireUser } from '../../../lib/auth';

export async function GET(req: Request) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const quizId = searchParams.get('id');

    if (quizId) {
      // Fetch specific quiz with questions
      const quiz = await db.select().from(quizzes).where(eq(quizzes.id, parseInt(quizId))).limit(1);
      if (!quiz.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

      const questions = await db.select().from(quizQuestions).where(eq(quizQuestions.quizId, parseInt(quizId))).orderBy(quizQuestions.orderIndex);

      return NextResponse.json({
        quiz: quiz[0],
        questions: questions
      });
    }

    // List all quizzes for user
    const persona = searchParams.get('persona');
    const userQuizzes = await db.select().from(quizzes).where(eq(quizzes.userId, user.id)).orderBy(desc(quizzes.createdAt));
    
    const filteredQuizzes = persona 
      ? userQuizzes.filter(q => {
          const rules = q.rules as any;
          return rules?.persona === persona || (!rules?.persona && persona === 'General');
        })
      : userQuizzes;

    return NextResponse.json({ quizzes: filteredQuizzes });
  } catch (error: any) {
    console.error('Quiz list error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
