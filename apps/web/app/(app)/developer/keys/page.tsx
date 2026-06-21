import { createClient } from '../../../../utils/supabase/server';
import { db } from '../../../../db';
import { apiKeys } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import KeysManager from './KeysManager';

export default async function DeveloperKeysPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const keys = await db.select().from(apiKeys).where(eq(apiKeys.userId, session.user.id));

  return (
    <div className="p-8 max-w-5xl">
      <KeysManager initialKeys={keys} />
    </div>
  );
}
