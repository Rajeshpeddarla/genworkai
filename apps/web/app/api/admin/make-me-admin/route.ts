import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { profiles } from '../../../../db/schema';
import { requireUser } from '../../../../lib/auth';
import { eq } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    await db.update(profiles)
      .set({ isAdmin: true })
      .where(eq(profiles.id, user.id));

    return NextResponse.json({ 
      success: true, 
      message: `Account ${user.email} successfully upgraded to Admin. You can now access the Admin portal at /admin. You can delete this file (apps/web/app/api/admin/make-me-admin/route.ts) now.` 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
