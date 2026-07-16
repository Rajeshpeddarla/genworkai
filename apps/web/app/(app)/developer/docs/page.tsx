import { createClient } from '../../../../utils/supabase/server';
import { redirect } from 'next/navigation';
import DocsViewer from './DocsViewer';

export const dynamic = 'force-dynamic';

export default async function DeveloperDocsPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  let openapi: any = null;
  try {
    const host = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${host}/api/openapi.json`, { cache: 'no-store' });
    if (res.ok) openapi = await res.json();
  } catch (err) {}

  return (
    <div className="w-full h-full bg-white dark:bg-black">
      <DocsViewer initialSpec={openapi} />
    </div>
  );
}