'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/developer', label: 'Overview' },
  { href: '/developer/keys', label: 'API Keys' },
  { href: '/developer/docs', label: 'Documentation' },
  { href: '/developer/playground', label: 'Playground' },
  { href: '/developer/usage', label: 'Usage & Billing' },
  { href: '/developer/logs', label: 'Request Logs' },
  { href: '/developer/status', label: 'API Status' },
  { href: '/developer/settings', label: 'Settings' },
];

export default function DeveloperSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold mb-4">Developer Portal</h2>
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`transition-colors px-2 py-1.5 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                    : 'text-neutral-600 hover:text-black hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          
          <Link
            href="/developer/webhooks"
            className={`transition-colors px-2 py-1.5 rounded-lg text-sm font-medium flex items-center justify-between ${
              pathname === '/developer/webhooks'
                ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                : 'text-neutral-600 hover:text-black hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800'
            }`}
          >
            <span>Webhooks</span>
            <span className="text-[10px] bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-500">Soon</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}
