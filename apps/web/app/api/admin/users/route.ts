import { NextResponse } from 'next/server';
import { db } from '@/db';
import { profiles, knowledgeBases } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';
import { safeErrorResponse } from '@/lib/errors';
import { logAuditEvent } from '@/lib/security/audit';

export async function GET(req: Request) {
  try {
    const { user, error } = await requireAdmin();
    if (error) return error;

    const users = await db.select().from(profiles).orderBy(desc(profiles.createdAt));
    return NextResponse.json(users);
  } catch (error: unknown) {
    return safeErrorResponse(error, 'Admin Users GET Route');
  }
}

export async function PATCH(req: Request) {
  try {
    const { user, error } = await requireAdmin();
    if (error) return error;

    const { userId, updates } = await req.json();
    if (!userId || !updates) return NextResponse.json({ error: 'Missing payload' }, { status: 400 });

    // Prevent mass assignment by only allowing specific fields
    const safeUpdates: Partial<typeof profiles.$inferInsert> = {};
    if (updates.isAdmin !== undefined) safeUpdates.isAdmin = updates.isAdmin;
    if (updates.isActive !== undefined) safeUpdates.isActive = updates.isActive;
    
    if (Object.keys(safeUpdates).length === 0) {
       return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const updated = await db.update(profiles).set(safeUpdates).where(eq(profiles.id, userId)).returning();

    // Audit log the profile update (e.g., admin granting another user admin access)
    await logAuditEvent({
      userId: user.id,
      action: 'ROLE_CHANGE',
      resourceType: 'profile',
      resourceId: undefined, // profiles use UUID strings for ID, not integers
      metadata: { targetUserId: userId, updates }
    });

    return NextResponse.json(updated[0]);
  } catch (error: unknown) {
    return safeErrorResponse(error, 'Admin Users PATCH Route');
  }
}
