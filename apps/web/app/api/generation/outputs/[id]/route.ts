import { NextResponse } from 'next/server';
import { db } from '@/db';
import { eq, desc } from 'drizzle-orm';
import { automationOutputs, automationOutputVersions } from '@/db/schema';
import { requireUser } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const { id } = await params;
    const outputId = parseInt(id);
    if (isNaN(outputId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const [output] = await db.select()
      .from(automationOutputs)
      .where(eq(automationOutputs.id, outputId));

    if (!output || output.userId !== user.id) {
      return NextResponse.json({ error: 'Output not found' }, { status: 404 });
    }

    const versions = await db.select()
      .from(automationOutputVersions)
      .where(eq(automationOutputVersions.outputId, outputId))
      .orderBy(desc(automationOutputVersions.versionNumber));

    return NextResponse.json({ success: true, output, versions });
  } catch (error: any) {
    console.error('Fetch output error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
