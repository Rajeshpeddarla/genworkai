import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tickets } from '@/db/schema';
import { z } from 'zod';
import { createApiClient } from '@/lib/auth';

const ticketSchema = z.object({
  type: z.enum(['demo', 'support', 'sales', 'partnership', 'bug', 'feature_request']),
  name: z.string().min(2),
  email: z.string().email(),
  company: z.string().optional(),
  subject: z.string().min(5),
  message: z.string().min(10),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createApiClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await req.json();
    const validated = ticketSchema.safeParse(body);

    if (!validated.success) {
      const errors = validated.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return NextResponse.json({ success: false, error: errors }, { status: 400 });
    }

    const ticketData = validated.data;

    await db.insert(tickets).values({
      userId: user?.id || null, // Optional tie to an authenticated user
      type: ticketData.type,
      name: ticketData.name,
      email: ticketData.email,
      company: ticketData.company,
      subject: ticketData.subject,
      message: ticketData.message,
      priority: ticketData.priority,
      status: 'open',
    });

    return NextResponse.json({ success: true, message: 'Ticket submitted successfully' });
  } catch (error: any) {
    console.error('Ticket submission error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createApiClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Import eq and desc here if not imported at top
    const { eq, desc } = await import('drizzle-orm');
    
    const userTickets = await db.select()
      .from(tickets)
      .where(eq(tickets.userId, user.id))
      .orderBy(desc(tickets.createdAt));

    return NextResponse.json(userTickets);
  } catch (error: any) {
    console.error('Failed to fetch user tickets:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
