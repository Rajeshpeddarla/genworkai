export default function DeveloperSettingsPage() { 
  return (
    <div className="p-8 lg:p-12 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Developer Settings</h1>
      <p className="text-neutral-500 mb-8">Configure your developer environment preferences.</p>
      
      <div className="grid gap-6">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-2">Default API Key</h3>
          <p className="text-sm text-neutral-500 mb-4">Select which key to use by default in the Playground.</p>
          <select className="bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg px-4 py-2 text-sm w-full max-w-md">
            <option>Select a key...</option>
          </select>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-2">Default Language</h3>
          <p className="text-sm text-neutral-500 mb-4">Preferred language for code samples.</p>
          <select className="bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg px-4 py-2 text-sm w-full max-w-md">
            <option>cURL</option>
            <option>Node.js (fetch)</option>
            <option>Python (requests)</option>
            <option>Go</option>
          </select>
        </div>
      </div>
    </div>
  ); 
}