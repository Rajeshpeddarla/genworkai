import { NextResponse } from 'next/server';
import { db } from '@/db';
import { quizzes, quizAttempts, quizQuestions } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

export async function POST(req: Request, { params }: { params: Promise<{ linkId: string }> }) {
  try {
    const { linkId } = await params;
    if (!linkId) return NextResponse.json({ error: 'Missing linkId' }, { status: 400 });

    const { guestName, guestRollNumber } = await req.json();

    if (!guestName || !guestRollNumber) {
      return NextResponse.json({ error: 'Name and Roll Number are required' }, { status: 400 });
    }

    const quiz = await db.query.quizzes.findFirst({
      where: eq(quizzes.shareableLink, linkId)
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Exam not found or link is invalid' }, { status: 404 });
    }

    if (quiz.status !== 'published') {
      return NextResponse.json({ error: 'Exam is not currently active' }, { status: 403 });
    }

    // Check Global Timing Constraints
    if (quiz.timingMode === 'global') {
      const now = new Date();
      if (quiz.startTime && now < new Date(quiz.startTime)) {
        return NextResponse.json({ error: 'Exam has not started yet' }, { status: 403 });
      }
      if (quiz.endTime && now > new Date(quiz.endTime)) {
        return NextResponse.json({ error: 'Exam has ended' }, { status: 403 });
      }
    }

    // Create Attempt
    const attempt = await db.insert(quizAttempts).values({
      quizId: quiz.id,
      guestName,
      guestRollNumber,
      status: 'in_progress',
      startedAt: new Date()
    }).returning();

    // Fetch Questions
    const questions = await db.query.quizQuestions.findMany({
      where: eq(quizQuestions.quizId, quiz.id),
      orderBy: [asc(quizQuestions.orderIndex)]
    });


    // Strip answers from questions before sending to client to prevent cheating
    const safeQuestions = questions.map((q: any) => ({
      ...q,
      correctAnswer: undefined,
      explanation: undefined
    }));

    return NextResponse.json({ 
      success: true, 
      attemptId: attempt[0]!.id,
      questions: safeQuestions
    });
  } catch (err: any) {
    console.error('Join Public Exam Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
