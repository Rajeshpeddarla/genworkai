import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { knowledgeBases, documents } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const kbs = await db.select().from(knowledgeBases).where(eq(knowledgeBases.userId, user.id));
    const docs = await db.select().from(documents);
    
    // Group documents by KB
    const kbWithDocs = kbs.map((kb: any) => {
      const kbDocs = docs.filter(d => d.kbId === kb.id);
      return { ...kb, documents: kbDocs, documentCount: kbDocs.length };
    });

    return NextResponse.json({ kbs: kbWithDocs }, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
// force turbopack reload
