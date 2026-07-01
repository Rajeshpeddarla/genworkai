import { HelpCircle, Book, Zap, Database, Shield, LayoutDashboard, Terminal } from "lucide-react";
import { db } from "@/db";
import { aiCreditCosts } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export default async function HelpPage() {
  const costs = await db.select().from(aiCreditCosts).where(eq(aiCreditCosts.isActive, true)).orderBy(desc(aiCreditCosts.credits));
  return (
    <div className="p-8 lg:p-12 max-w-5xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <HelpCircle className="w-8 h-8 text-violet-500" />
          Documentation & Help
        </h1>
        <p className="text-neutral-500 mt-2 text-lg">
          Learn how the platform works, how AI Credits are consumed, and get the most out of GenWorkAI.
        </p>
      </div>

      <div className="space-y-12">
        {/* Section: AI Credit System */}
        <section>
          <h2 className="text-2xl font-bold border-b border-neutral-200 dark:border-neutral-800 pb-3 mb-6 flex items-center gap-2">
            <Zap className="w-6 h-6 text-fuchsia-500" />
            Understanding AI Credits
          </h2>
          <div className="prose prose-violet dark:prose-invert max-w-none">
            <p>
              Every AI-powered operation across the platform consumes <strong>AI Credits</strong>. 
              Credits are drawn from a unified balance, providing flexibility whether you're using our UI Studios or API endpoints.
            </p>
            <h3>Credit Deduction Hierarchy</h3>
            <p>Credits are always consumed in this order to maximize value:</p>
            <ol>
              <li><strong>Monthly Plan Credits:</strong> Reset on the first of every month based on your subscription tier.</li>
              <li><strong>Purchased Credit Packs:</strong> One-time purchases that never expire. Consumed only when monthly credits are exhausted.</li>
            </ol>

            <h3>Credit Consumption Rates</h3>
            <p>Different AI operations have different costs based on their computational requirements:</p>
            <div className="overflow-x-auto not-prose mt-6">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                    <th className="p-4 font-semibold">Operation</th>
                    <th className="p-4 font-semibold text-right">Cost (Credits)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {costs.map((cost) => (
                    <tr key={cost.id}>
                      <td className="p-4">
                        <div className="font-medium text-neutral-900 dark:text-neutral-100">{cost.displayName}</div>
                        <div className="text-xs text-neutral-500">{cost.description}</div>
                      </td>
                      <td className="p-4 text-right font-medium">{cost.credits === 0 ? "Free (0)" : cost.credits}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Section: Feature Limits */}
        <section>
          <h2 className="text-2xl font-bold border-b border-neutral-200 dark:border-neutral-800 pb-3 mb-6 flex items-center gap-2">
            <Shield className="w-6 h-6 text-green-500" />
            Resource Limits
          </h2>
          <div className="prose prose-violet dark:prose-invert max-w-none">
            <p>
              In addition to AI Credits, your subscription plan determines the maximum number of structural resources you can create.
            </p>
            <ul>
              <li><strong>Workspaces:</strong> Number of distinct collaborative environments you can spin up.</li>
              <li><strong>Knowledge Bases:</strong> Number of distinct vector stores you can maintain.</li>
              <li><strong>Context Size:</strong> Total MBs of raw data you can upload into Knowledge Bases.</li>
              <li><strong>Database Connections:</strong> Total distinct SQL/NoSQL databases you can securely connect.</li>
            </ul>
            <p>
              Resource limits are absolute maximums. Deleting a resource frees up that slot. 
              You can check your exact resource utilization at any time from your <strong>Settings &gt; Subscription</strong> page.
            </p>
          </div>
        </section>

        {/* Section: Studios */}
        <section>
          <h2 className="text-2xl font-bold border-b border-neutral-200 dark:border-neutral-800 pb-3 mb-6 flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-blue-500" />
            Platform Capabilities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="p-6 border border-neutral-200 dark:border-neutral-800 rounded-xl">
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                <Terminal className="w-5 h-5 text-neutral-500" />
                Developer APIs
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Generate API keys to integrate our unified AI generation capabilities directly into your custom applications. API keys enforce rate limits and draw directly from your AI Credit balance.
              </p>
            </div>
            <div className="p-6 border border-neutral-200 dark:border-neutral-800 rounded-xl">
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                <Database className="w-5 h-5 text-neutral-500" />
                Database Intelligence
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Securely connect a Postgres database to instantly query, analyze, and chart your proprietary data without writing complex SQL scripts. 
              </p>
            </div>
            <div className="p-6 border border-neutral-200 dark:border-neutral-800 rounded-xl">
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                <Book className="w-5 h-5 text-neutral-500" />
                Knowledge Bases
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Upload PDFs, TXTs, or connect Confluence integrations to build specialized contexts. Attach KBs to any workspace chat to ground AI responses in your organizational data.
              </p>
            </div>
            <div className="p-6 border border-neutral-200 dark:border-neutral-800 rounded-xl">
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                <Zap className="w-5 h-5 text-neutral-500" />
                Automation Studio
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Run background tasks that churn through massive contexts to generate complex reports, code reviews, and presentations asynchronously.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
