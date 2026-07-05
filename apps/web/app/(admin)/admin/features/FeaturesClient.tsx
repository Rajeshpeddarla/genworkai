"use client";

import { ToggleLeft, ToggleRight, Server, Database, BrainCircuit, Terminal, Zap, Key } from "lucide-react";
import { toggleFeatureFlag } from "./actions";
import { useTransition } from "react";

const iconMap: Record<string, any> = {
  knowledge_base: BrainCircuit,
  database_intelligence: Database,
  automation_studio: Zap,
  mcp_builder: Server,
  byok: Key,
  public_api: Terminal,
};

export default function FeaturesClient({ initialFlags }: { initialFlags: any[] }) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = (id: number, currentEnabled: boolean) => {
    startTransition(() => {
      toggleFeatureFlag(id, !currentEnabled);
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Feature Flags</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Globally enable or disable platform features.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-card border border-zinc-200 dark:border-white/10 rounded-2xl overflow-hidden">
        <ul className="divide-y divide-zinc-200 dark:divide-white/10">
          {initialFlags.map((flag) => {
            const IconComponent = iconMap[flag.key] || Zap;
            
            return (
              <li key={flag.id} className={`p-6 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors ${isPending ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${flag.isEnabled ? 'bg-violet-500/20 text-violet-600 dark:text-violet-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{flag.name}</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{flag.description}</p>
                    <p className="text-xs text-zinc-500 font-mono mt-1">key: {flag.key}</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleToggle(flag.id, flag.isEnabled)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    flag.isEnabled 
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/30' 
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {flag.isEnabled ? (
                    <><ToggleRight className="w-5 h-5" /> Enabled</>
                  ) : (
                    <><ToggleLeft className="w-5 h-5" /> Disabled</>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
