import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Client } from "pg";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    
    // Create supabase client with anon key for token verification
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );
    
    // Validate the token passed in header (it should be the user's session token)
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    let admin = false;
    if (user.email === 'base@parseadmin.admin') {
      admin = true;
    } else {
      const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
      if (data && data.is_admin) admin = true;
    }
    
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      return NextResponse.json({ error: "Database misconfiguration" }, { status: 500 });
    }

    const client = new Client({ connectionString });
    await client.connect();

    // Total Users
    const usersRes = await client.query('SELECT count(*) FROM auth.users');
    const totalUsers = parseInt(usersRes.rows[0].count, 10);
    
    // Total Requests
    const docsRes = await client.query('SELECT count(*) FROM baseparse_documents');
    const totalRequests = parseInt(docsRes.rows[0].count, 10);

    // Subscription Counts
    const plansRes = await client.query(`
      SELECT p.name, count(up.id) 
      FROM baseparse_pricing_plans p 
      LEFT JOIN baseparse_user_plans up ON p.id = up.plan_id 
      GROUP BY p.name
    `);
    
    const subscriptions = plansRes.rows.map(row => ({
      name: row.name,
      count: parseInt(row.count, 10)
    }));

    await client.end();

    return NextResponse.json({
      totalUsers,
      totalRequests,
      subscriptions
    });

  } catch (error: any) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
