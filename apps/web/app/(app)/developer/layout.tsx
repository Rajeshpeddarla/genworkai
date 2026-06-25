import { ReactNode } from 'react';
import Link from 'next/link';
import AIAssistantWidget from '../../../components/developer/AIAssistantWidget';
export default function DeveloperLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="w-64 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-bold mb-4">Developer Portal</h2>
          <nav className="flex flex-col gap-2">
            <Link href="/developer" className="text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white transition-colors">
              Overview
            </Link>
            <Link href="/developer/keys" className="text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white transition-colors">
              API Keys
            </Link>
            <Link href="/developer/docs" className="text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white transition-colors">
              Documentation
            </Link>
            <Link href="/developer/playground" className="text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white transition-colors">
              Playground
            </Link>
            <Link href="/developer/sdks" className="text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white transition-colors">
              SDKs & Examples
            </Link>
            <Link href="/developer/usage" className="text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white transition-colors">
              Usage & Billing
            </Link>
            <Link href="/developer/logs" className="text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white transition-colors">
              Request Logs
            </Link>
            <Link href="/developer/status" className="text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white transition-colors">
              API Status
            </Link>
            <Link href="/developer/webhooks" className="text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white transition-colors flex items-center justify-between">
              <span>Webhooks</span>
              <span className="text-[10px] bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-500">Soon</span>
            </Link>
            <Link href="/developer/settings" className="text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white transition-colors">
              Settings
            </Link>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>

      <AIAssistantWidget />
    </div>
  );
}
