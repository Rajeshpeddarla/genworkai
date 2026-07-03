import { NextResponse } from 'next/server';
import { requireUser } from '../../../../../lib/auth';
import { db } from '../../../../../db';
import { quizzes } from '../../../../../db/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const { id } = await params;
    const quizId = parseInt(id);
    if (isNaN(quizId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const { timingMode, startTime, endTime } = await req.json();

    const quiz = await db.query.quizzes.findFirst({
      where: and(eq(quizzes.id, quizId), eq(quizzes.userId, user.id))
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    // Generate unique shareable link if not exists
    const shareableLink = quiz.shareableLink || crypto.randomUUID();

    await db.update(quizzes)
      .set({ 
        shareableLink,
        timingMode: timingMode || 'self_paced',
        startTime: startTime ? new Date(startTime) : null,
        endTime: endTime ? new Date(endTime) : null,
        updatedAt: new Date()
      })
      .where(eq(quizzes.id, quizId));

    return NextResponse.json({ shareableLink });
  } catch (err: any) {
    console.error('Share Quiz Error:', err);
    return NextResponse.json({ error: 'Failed to generate share link' }, { status: 500 });
  }
}
