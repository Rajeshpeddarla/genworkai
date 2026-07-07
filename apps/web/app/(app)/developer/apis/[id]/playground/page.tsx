'use client';

export default function ApiPlayground() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex items-center justify-center font-mono text-sm">API</div>
        <div>
          <h1 className="text-2xl font-bold">study-plan-generator</h1>
          <p className="text-neutral-500 font-mono text-sm">POST /api/v1/workspace/study-plan-generator</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Request Side */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden flex flex-col h-[500px]">
            <div className="border-b border-neutral-200 dark:border-neutral-800 p-4 font-mono text-sm font-bold bg-neutral-50 dark:bg-neutral-950 flex justify-between items-center">
              <span>Request Payload (JSON)</span>
              <button className="text-violet-600 dark:text-violet-400 hover:underline">Autofill from Schema</button>
            </div>
            <div className="p-4 flex-1 font-mono text-sm">
              <pre className="outline-none" contentEditable>{`{
  "hoursPerDay": 4,
  "examDate": "2024-02-10",
  "completedTopics": [
    "Digital Logic",
    "Data Structures"
  ]
}`}</pre>
            </div>
            <div className="border-t border-neutral-200 dark:border-neutral-800 p-4 bg-neutral-50 dark:bg-neutral-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="stream" className="rounded" />
                <label htmlFor="stream" className="text-sm font-medium">Use SSE Streaming</label>
              </div>
              <button className="bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-xl font-medium hover:opacity-90">
                Send Request
              </button>
            </div>
          </div>
          
          <div className="bg-neutral-950 text-white border border-neutral-800 rounded-2xl overflow-hidden">
            <div className="border-b border-neutral-800 p-4 font-mono text-sm text-neutral-400 flex gap-4">
              <span className="text-white">cURL</span>
              <span className="cursor-pointer hover:text-white transition-colors">JavaScript</span>
              <span className="cursor-pointer hover:text-white transition-colors">Python</span>
              <span className="cursor-pointer hover:text-white transition-colors">Flutter</span>
            </div>
            <div className="p-4 font-mono text-sm overflow-x-auto text-green-400">
              <pre>{`curl -X POST https://api.genwork.ai/api/v1/workspace/study-plan-generator \\
  -H "Authorization: Bearer gk_live_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "hoursPerDay": 4,
    "examDate": "2024-02-10",
    "completedTopics": ["Digital Logic"]
  }'`}</pre>
            </div>
          </div>
        </div>

        {/* Response Side */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl flex flex-col h-[700px] lg:h-auto">
          <div className="border-b border-neutral-200 dark:border-neutral-800 p-4 flex justify-between items-center bg-neutral-50 dark:bg-neutral-950">
            <span className="font-mono text-sm font-bold">Response</span>
            <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">200 OK</span>
          </div>
          <div className="p-4 font-mono text-sm text-neutral-500 flex-1 overflow-auto bg-neutral-50/50 dark:bg-neutral-950/50">
            Click "Send Request" to see the output here...
          </div>
          <div className="border-t border-neutral-200 dark:border-neutral-800 p-4 bg-neutral-50 dark:bg-neutral-950 text-xs text-neutral-500 font-mono flex justify-between">
            <span>Latency: 0ms</span>
            <span>Tokens: 0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
