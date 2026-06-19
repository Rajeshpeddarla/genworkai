import { ReactNode } from 'react';
import Link from 'next/link';

export default function DeveloperLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Developer Sidebar */}
      <div className="w-64 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-bold mb-4">Developer Portal</h2>
          <nav className="flex flex-col gap-2">
            <Link href="/developer/keys" className="text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white transition-colors">
              API Keys
            </Link>
            <Link href="/developer/byok" className="text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white transition-colors">
              LLM Providers (BYOK)
            </Link>
            <Link href="/developer/usage" className="text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white transition-colors">
              Usage & Metering
            </Link>
            <Link href="/developer/playground" className="text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white transition-colors">
              API Playground
            </Link>
            <Link href="/api/openapi.json" target="_blank" className="text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white transition-colors">
              OpenAPI Docs ↗
            </Link>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
