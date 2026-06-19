import { NextResponse } from 'next/server';
import { db } from '../../../../../db';
import { userLlmKeys } from '../../../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { createClient } from '../../../../../utils/supabase/server';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const result = await db.delete(userLlmKeys)
      .where(and(eq(userLlmKeys.id, id), eq(userLlmKeys.userId, session.user.id)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Config not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete BYOK config:', error);
    return NextResponse.json({ error: 'Failed to delete config' }, { status: 500 });
  }
}
