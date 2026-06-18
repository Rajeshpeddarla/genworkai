import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { knowledgeBases } from '../../../../db/schema';
import { checkKnowledgeBaseLimit } from '../../../../lib/limits';
import { requireUser } from '../../../../lib/auth';
import { safeErrorResponse, ValidationError } from '../../../../lib/errors';
import { RateLimitService } from '../../../../lib/security/rate-limit';

export async function POST(req: Request) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const rateLimitResponse = await RateLimitService.check(user.id, 'default');
    if (rateLimitResponse) return rateLimitResponse;

    const limitCheck = await checkKnowledgeBaseLimit(user.id);
    if (!limitCheck.allowed) {
      throw new ValidationError(`Limit reached. You can only create up to ${limitCheck.limit} Knowledge Bases on the free plan.`);
    }

    const { name, description, color } = await req.json();
    if (!name) {
      throw new ValidationError('Name required');
    }

    const defaultColors = ['fuchsia', 'blue', 'orange', 'emerald', 'violet', 'rose'];
    const assignedColor = color || defaultColors[Math.floor(Math.random() * defaultColors.length)];

    const newKb = await db.insert(knowledgeBases).values({ 
      userId: user.id,
      name, 
      description: description || null, 
      color: assignedColor 
    }).returning();
    
    return NextResponse.json({ success: true, kb: newKb[0] });
  } catch (error: unknown) {
    return safeErrorResponse(error, 'Create Knowledge Base Route');
  }
}
