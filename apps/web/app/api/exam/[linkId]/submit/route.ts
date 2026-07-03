import { NextResponse } from 'next/server';
import { db } from '@/db';
import { quizzes, quizAttempts, quizQuestions, quizAttemptAnswers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req: Request, { params }: { params: Promise<{ linkId: string }> }) {
  try {
    const { linkId } = await params;
    if (!linkId) return NextResponse.json({ error: 'Missing linkId' }, { status: 400 });

    const { attemptId, answers, warningsCount, antiCheatingLogs } = await req.json();

    if (!attemptId) {
      return NextResponse.json({ error: 'attemptId is required' }, { status: 400 });
    }

    const quiz = await db.query.quizzes.findFirst({
      where: eq(quizzes.shareableLink, linkId)
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    const attempt = await db.query.quizAttempts.findFirst({
      where: and(eq(quizAttempts.id, attemptId), eq(quizAttempts.quizId, quiz.id))
    });

    if (!attempt || attempt.status !== 'in_progress') {
      return NextResponse.json({ error: 'Invalid attempt or already submitted' }, { status: 400 });
    }

    const questions = await db.query.quizQuestions.findMany({
      where: eq(quizQuestions.quizId, quiz.id)
    });

    let totalScore = 0;
    let totalMarks = questions.length; // Assuming 1 mark per question for simplicity
    
    // Process answers
    const insertData = [];
    for (const q of questions) {
      const userAnswer = answers[q.id];
      const isCorrect = userAnswer === q.correctAnswer;
      if (isCorrect) totalScore += 1;
      
      insertData.push({
        attemptId,
        questionId: q.id,
        userAnswer: userAnswer || '',
        status: userAnswer ? 'answered' : 'not_visited',
        isCorrect,
        marksAwarded: isCorrect ? '1.00' : '0.00'
      });
    }

    // Save answers
    if (insertData.length > 0) {
      await db.insert(quizAttemptAnswers).values(insertData);
    }

    // Update attempt
    await db.update(quizAttempts)
      .set({
        status: 'submitted',
        score: totalScore.toString(),
        totalMarks: totalMarks.toString(),
        warningsCount: warningsCount || 0,
        antiCheatingLogs,
        finishedAt: new Date()
      })
      .where(eq(quizAttempts.id, attemptId));

    return NextResponse.json({ success: true, score: totalScore, totalMarks });
  } catch (err: any) {
    console.error('Submit Public Exam Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
