import { createClient } from '../../../../utils/supabase/server';
import { db } from '../../../../db';
import { apiUsageLogs } from '../../../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export default async function DeveloperUsagePage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const logs = await db.select()
    .from(apiUsageLogs)
    .where(eq(apiUsageLogs.userId, session.user.id))
    .orderBy(desc(apiUsageLogs.createdAt))
    .limit(50);

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Usage & Metering</h1>
        <p className="text-neutral-500 mt-1">Monitor your API calls, vector searches, and LLM token usage.</p>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800">
            <tr>
              <th className="px-6 py-4 font-medium text-sm text-neutral-500">ENDPOINT</th>
              <th className="px-6 py-4 font-medium text-sm text-neutral-500">RESOURCE</th>
              <th className="px-6 py-4 font-medium text-sm text-neutral-500">STATUS</th>
              <th className="px-6 py-4 font-medium text-sm text-neutral-500 text-right">METRICS</th>
              <th className="px-6 py-4 font-medium text-sm text-neutral-500 text-right">TIME</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                  No API usage recorded yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const metrics = (log.metrics as any) || {};
                return (
                  <tr key={log.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <td className="px-6 py-4 font-medium font-mono text-sm">{log.endpoint}</td>
                    <td className="px-6 py-4 text-sm">
                      {log.resourceType} <span className="text-neutral-500">#{log.resourceId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${log.status === 200 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      {metrics.llm_tokens ? <span className="text-purple-600 dark:text-purple-400 block">{metrics.llm_tokens} tokens</span> : null}
                      {metrics.vector_searches ? <span className="text-blue-600 dark:text-blue-400 block">{metrics.vector_searches} searches</span> : null}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-500 text-right">
                      {new Date(log.createdAt!).toLocaleString()}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
