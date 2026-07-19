import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Client } from "pg";

async function verifyAdmin(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return false;
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
  
  const token = authHeader.substring(7);
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return false;
  
  if (user.email === 'base@parseadmin.admin') return true;
  
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
  return data?.is_admin === true;
}

export async function GET(request: Request) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) return NextResponse.json({ error: "Database misconfig" }, { status: 500 });

    const client = new Client({ connectionString });
    await client.connect();

    const usersRes = await client.query(`
      SELECT 
        u.id, 
        u.email, 
        u.last_sign_in_at,
        p.full_name,
        p.avatar_url,
        p.country,
        up.id as user_plan_id,
        up.pages_extracted_this_month,
        pp.name as plan_name,
        pp.page_extraction_limit,
        pp.id as plan_id
      FROM auth.users u
      LEFT JOIN public.profiles p ON u.id = p.id
      LEFT JOIN public.baseparse_user_plans up ON u.id = up.user_id
      LEFT JOIN public.baseparse_pricing_plans pp ON up.plan_id = pp.id
      ORDER BY u.created_at DESC
    `);
    
    // Also fetch all available plans for the upgrade dropdown
    const plansRes = await client.query(`SELECT id, name FROM baseparse_pricing_plans WHERE is_active = true`);

    await client.end();

    const users = usersRes.rows.map(row => {
      // Logic for online/offline: Online if signed in within the last 24 hours
      const lastSignIn = new Date(row.last_sign_in_at).getTime();
      const isOnline = (Date.now() - lastSignIn) < 24 * 60 * 60 * 1000;

      return {
        id: row.id,
        email: row.email,
        name: row.full_name || "Unknown",
        avatar: row.avatar_url,
        country: row.country || "Unknown",
        isOnline,
        plan: {
          id: row.plan_id,
          name: row.plan_name || "No Plan",
          extracted: row.pages_extracted_this_month || 0,
          limit: row.page_extraction_limit || 0
        },
        userPlanId: row.user_plan_id
      };
    });

    return NextResponse.json({ users, availablePlans: plansRes.rows });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { userId, newPlanId } = await request.json();
    if (!userId || !newPlanId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const connectionString = process.env.DATABASE_URL;
    const client = new Client({ connectionString });
    await client.connect();

    // Check if user already has a plan
    const checkRes = await client.query('SELECT id FROM baseparse_user_plans WHERE user_id = $1', [userId]);
    
    if (checkRes.rows.length > 0) {
      // Update
      await client.query('UPDATE baseparse_user_plans SET plan_id = $1, updated_at = NOW() WHERE user_id = $2', [newPlanId, userId]);
    } else {
      // Insert
      await client.query('INSERT INTO baseparse_user_plans (user_id, plan_id, pages_extracted_this_month, status) VALUES ($1, $2, 0, $3)', [userId, newPlanId, 'active']);
    }

    await client.end();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
