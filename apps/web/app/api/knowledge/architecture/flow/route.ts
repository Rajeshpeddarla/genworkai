import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkFlowLimit } from '@/lib/limits';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const adminSupabase = createClient(supabaseUrl, supabaseKey); // Using service role or publishable key for admin tasks if needed

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

    const limitCheck = await checkFlowLimit(user.id);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: `Limit reached. You can only create up to ${limitCheck.limit} Flows on the free plan.` }, 
        { status: 403, headers: corsHeaders }
      );
    }

    const { kbId, name, description, steps } = await req.json();

    if (!kbId || !name || !steps) {
      return NextResponse.json({ error: 'kbId, name, and steps are required' }, { status: 400, headers: corsHeaders });
    }

    const kbIdInt = parseInt(kbId, 10);

    const { data: inserted, error } = await adminSupabase.from('business_flows').insert({
       kb_id: kbIdInt,
       name,
       description,
       steps,
       is_manual_override: true
    }).select();

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, flow: inserted?.[0] }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('Create Flow API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create custom flow' }, { status: 500, headers: corsHeaders });
  }
}
