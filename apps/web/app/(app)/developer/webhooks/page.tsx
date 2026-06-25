import { Webhook } from 'lucide-react';

export default function DeveloperWebhooksPage() {
  return (
    <div className="p-8 lg:p-12 max-w-7xl mx-auto h-full flex flex-col items-center justify-center text-center">
      <div className="w-20 h-20 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-2xl flex items-center justify-center mb-6">
        <Webhook className="w-10 h-10" />
      </div>
      <h1 className="text-3xl font-bold mb-4">Webhooks (Coming Soon)</h1>
      <p className="text-neutral-500 max-w-md mb-8">
        We are building a robust event-driven architecture to allow you to receive real-time updates when Knowledge Bases finish syncing, Automations complete, or usage limits are reached.
      </p>
      
      <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 max-w-md w-full">
        <h3 className="font-bold mb-2">Join the Early Access List</h3>
        <p className="text-sm text-neutral-500 mb-4">Get notified the moment webhooks go live.</p>
        <div className="flex gap-2">
          <input type="email" placeholder="developer@company.com" className="flex-1 bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500" />
          <button className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg text-sm font-bold">Subscribe</button>
        </div>
      </div>
    </div>
  );
}