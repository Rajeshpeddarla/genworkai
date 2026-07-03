import { NextResponse } from 'next/server';
import { db } from '@/db';
import { quizzes, quizAttempts, quizQuestions, quizAttemptAnswers } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: Request, { params }: { params: Promise<{ linkId: string }> }) {
  try {
    const { linkId } = await params;
    if (!linkId) return NextResponse.json({ error: 'Missing linkId' }, { status: 400 });

    const quiz = await db.query.quizzes.findFirst({
      where: eq(quizzes.shareableLink, linkId)
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Exam not found or link is invalid' }, { status: 404 });
    }

    // Return safe data for the Join screen
    return NextResponse.json({ 
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      rules: quiz.rules,
      timingMode: quiz.timingMode,
      startTime: quiz.startTime,
      endTime: quiz.endTime,
      status: quiz.status
    });
  } catch (err: any) {
    console.error('Fetch Public Exam Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
