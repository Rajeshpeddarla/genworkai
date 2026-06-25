import { Code2, Package, Terminal } from 'lucide-react';

export default function DeveloperSDKsPage() {
  return (
    <div className="p-8 lg:p-12 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">SDKs & Integrations</h1>
      <p className="text-neutral-500 mb-8">Official libraries to quickly integrate GenWorkAI into your application.</p>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm hover:border-violet-500 transition-colors">
          <div className="w-12 h-12 bg-[#3178C6] text-white rounded-lg flex items-center justify-center font-bold text-xl mb-4">TS</div>
          <h3 className="font-bold text-lg mb-2">Node.js / TypeScript</h3>
          <p className="text-sm text-neutral-500 mb-4 h-10">The official Node.js library for the GenWorkAI API.</p>
          <div className="bg-neutral-100 dark:bg-black p-3 rounded font-mono text-xs flex items-center justify-between">
            <span>npm install @genworkai/node</span>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm hover:border-violet-500 transition-colors">
          <div className="w-12 h-12 bg-[#3776AB] text-white rounded-lg flex items-center justify-center font-bold text-xl mb-4">Py</div>
          <h3 className="font-bold text-lg mb-2">Python</h3>
          <p className="text-sm text-neutral-500 mb-4 h-10">The official Python library for the GenWorkAI API.</p>
          <div className="bg-neutral-100 dark:bg-black p-3 rounded font-mono text-xs flex items-center justify-between">
            <span>pip install genworkai</span>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm hover:border-violet-500 transition-colors">
          <div className="w-12 h-12 bg-[#00ADD8] text-white rounded-lg flex items-center justify-center font-bold text-xl mb-4">Go</div>
          <h3 className="font-bold text-lg mb-2">Go (Golang)</h3>
          <p className="text-sm text-neutral-500 mb-4 h-10">The official Go module for the GenWorkAI API.</p>
          <div className="bg-neutral-100 dark:bg-black p-3 rounded font-mono text-xs flex items-center justify-between">
            <span>go get github.com/genworkai/go</span>
          </div>
        </div>

      </div>

      <h2 className="text-2xl font-bold mt-16 mb-6">Integration Guides</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 flex items-start gap-4 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 cursor-pointer transition-colors">
          <div className="p-3 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-lg">
            <Code2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold mb-1">Building an RAG Pipeline</h4>
            <p className="text-sm text-neutral-500">Learn how to connect your Knowledge Base to a custom LLM UI.</p>
          </div>
        </div>
        
        <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 flex items-start gap-4 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 cursor-pointer transition-colors">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold mb-1">Automating Database Queries</h4>
            <p className="text-sm text-neutral-500">Set up a daily cron job that emails a summary of your database.</p>
          </div>
        </div>
      </div>
    </div>
  );
}