import { createClient } from '../../../../utils/supabase/server';
import { db } from '../../../../db';
import { apiKeys } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import PlaygroundClient from './PlaygroundClient';

export const dynamic = 'force-dynamic';

export default async function DeveloperPlaygroundPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  // Fetch API keys
  const keys = await db.select().from(apiKeys).where(eq(apiKeys.userId, session.user.id));
  
  // Fetch OpenAPI Spec
  let openapi = null;
  try {
    const host = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${host}/api/openapi.json`, { cache: 'no-store' });
    if (res.ok) {
      openapi = await res.json();
    }
  } catch (err) {}

  return (
    <div className="h-full">
      <PlaygroundClient initialKeys={keys} initialSpec={openapi} />
    </div>
  );
}
