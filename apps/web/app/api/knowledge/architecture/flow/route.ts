import { NextResponse } from 'next/server';
import { db } from '../../../../../db';
import { businessFlows } from '../../../../../db/schema';
import { requireUser, requireOwnership } from '../../../../../lib/auth';
import { safeErrorResponse, ValidationError } from '../../../../../lib/errors';
import { checkFlowLimit } from '../../../../../lib/limits';

export async function POST(req: Request) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const limitCheck = await checkFlowLimit(user.id);
    if (!limitCheck.allowed) {
      throw new Error(`Limit reached. You can only create up to ${limitCheck.limit} Flows on the free plan.`);
    }

    const { kbId, name, description, steps } = await req.json();

    if (!kbId || !name || !steps) {
      throw new ValidationError('kbId, name, and steps are required');
    }

    const kbIdInt = parseInt(kbId, 10);
    const ownershipError = await requireOwnership('knowledge_base', kbIdInt, user.id);
    if (ownershipError) return ownershipError;

    const inserted = await db.insert(businessFlows).values({
       kbId: kbIdInt,
       name,
       description,
       steps,
       isManualOverride: true
    }).returning();

    return NextResponse.json({ success: true, flow: inserted[0] });

  } catch (error: unknown) {
    return safeErrorResponse(error, 'Create Custom Flow Route');
  }
}
