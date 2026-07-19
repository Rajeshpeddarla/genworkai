require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function createAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !anonKey) {
    console.error("Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, anonKey);

  const email = 'base@parseadmin.admin';
  const password = 'Rajesh@428';

  console.log(`Attempting to sign up ${email}...`);
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error("Sign up failed:", error.message);
  } else {
    console.log("Sign up succeeded!", data.user ? `User ID: ${data.user.id}` : "Check your email for confirmation (if email confirmations are enabled).");
  }
}

createAdmin();
