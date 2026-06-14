import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { documents } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'Document ID required' }, { status: 400 });

    await db.delete(documents).where(eq(documents.id, id));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete document:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
