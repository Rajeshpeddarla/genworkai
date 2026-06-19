import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { earlyAccessRequests } from '@/db/schema';
import { z } from 'zod';

const earlyAccessSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  company: z.string().optional(),
  useCase: z.string().min(10)
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = earlyAccessSchema.parse(body);

    await db.insert(earlyAccessRequests).values({
      name: validated.name,
      email: validated.email,
      company: validated.company,
      useCase: validated.useCase,
      status: 'pending'
    });

    return NextResponse.json({ success: true, message: 'Early access request submitted successfully' });
  } catch (error: any) {
    console.error('Early access error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
