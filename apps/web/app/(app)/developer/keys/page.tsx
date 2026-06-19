import { createClient } from '../../../../utils/supabase/server';
import { db } from '../../../../db';
import { apiKeys } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export default async function DeveloperKeysPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const keys = await db.select().from(apiKeys).where(eq(apiKeys.userId, session.user.id));

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">API Keys</h1>
          <p className="text-neutral-500 mt-1">Manage your platform API keys and resource scopes.</p>
        </div>
        <button className="bg-black text-white dark:bg-white dark:text-black px-4 py-2 rounded-lg font-medium hover:opacity-90">
          + Generate New Key
        </button>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800">
            <tr>
              <th className="px-6 py-4 font-medium text-sm text-neutral-500">NAME</th>
              <th className="px-6 py-4 font-medium text-sm text-neutral-500">PREFIX</th>
              <th className="px-6 py-4 font-medium text-sm text-neutral-500">SCOPES</th>
              <th className="px-6 py-4 font-medium text-sm text-neutral-500">CREATED</th>
              <th className="px-6 py-4 font-medium text-sm text-neutral-500 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {keys.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                  No API keys generated yet.
                </td>
              </tr>
            ) : (
              keys.map((key) => (
                <tr key={key.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <td className="px-6 py-4 font-medium">{key.name}</td>
                  <td className="px-6 py-4">
                    <code className="bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded text-sm text-neutral-600 dark:text-neutral-400">
                      {key.keyPrefix}...
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {((key.scopes as string[]) || []).map(scope => (
                        <span key={scope} className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full">
                          {scope}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-500">
                    {new Date(key.createdAt!).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-red-500 hover:text-red-600 font-medium text-sm">Revoke</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
