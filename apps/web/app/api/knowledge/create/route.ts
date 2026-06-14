import { NextResponse } from 'next/server';
import { db } from '../../../../db';
import { knowledgeBases } from '../../../../db/schema';
import { checkKnowledgeBaseLimit } from '../../../../lib/limits';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
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

    const limitCheck = await checkKnowledgeBaseLimit(user.id);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: `Limit reached. You can only create up to ${limitCheck.limit} Knowledge Bases on the free plan.` }, 
        { status: 403, headers: corsHeaders }
      );
    }

    const { name, description, color } = await req.json();
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400, headers: corsHeaders });

    const defaultColors = ['fuchsia', 'blue', 'orange', 'emerald', 'violet', 'rose'];
    const assignedColor = color || defaultColors[Math.floor(Math.random() * defaultColors.length)];

    const newKb = await db.insert(knowledgeBases).values({ 
      userId: user.id,
      name, 
      description: description || null, 
      color: assignedColor 
    }).returning();
    
    return NextResponse.json({ success: true, kb: newKb[0] }, { headers: corsHeaders });
  } catch (error: any) {
    console.error("Failed to create KB:", error);
    return NextResponse.json({ error: error.message || 'Failed to create' }, { status: 500, headers: corsHeaders });
  }
}
