import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { knowledgeBases, connectedDatabases, knowledgeSources } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

    // Fetch all KBs
    const kbs = await db.select().from(knowledgeBases).where(eq(knowledgeBases.userId, user.id));
    
    // We need to fetch databases connected to these KBs
    // and knowledge sources (GitHub, Websites, APIs) connected to these KBs
    
    const kbIds = kbs.map(kb => kb.id);
    
    let dbs: any[] = [];
    let sources: any[] = [];

    if (kbIds.length > 0) {
      // Drizzle doesn't support 'in' with empty arrays, so check length
      // For simplicity, we can fetch all and filter, or use an 'inArray' if imported.
      // Since it's MVP, let's just fetch all and filter in memory, or import inArray.
      const allDbs = await db.select().from(connectedDatabases);
      dbs = allDbs.filter(d => kbIds.includes(d.kbId!));
      
      const allSources = await db.select().from(knowledgeSources);
      sources = allSources.filter(s => kbIds.includes(s.kbId!));
    }

    const availableSources = [
      ...kbs.map(kb => ({ id: `kb_${kb.id}`, type: 'knowledge_base', name: kb.name, internalId: kb.id })),
      ...dbs.map(d => ({ id: `db_${d.id}`, type: 'database', name: d.name, kbId: d.kbId, internalId: d.id })),
      ...sources.map(s => ({ id: `src_${s.id}`, type: s.type, name: s.name, kbId: s.kbId, internalId: s.id }))
    ];

    return NextResponse.json({ sources: availableSources }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Fetch sources error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch sources' }, { status: 500, headers: corsHeaders });
  }
}
