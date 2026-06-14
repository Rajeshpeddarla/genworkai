import { Network } from "lucide-react";

export default function AppLoading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full min-h-[500px]">
      <div className="relative">
        <div className="absolute inset-0 bg-fuchsia-500/20 blur-xl rounded-full animate-pulse"></div>
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-2xl relative animate-pulse">
          <Network className="w-8 h-8 text-white animate-spin-slow" style={{ animationDuration: '3s' }} />
        </div>
      </div>
      <h3 className="mt-6 text-lg font-medium text-zinc-900 dark:text-white animate-pulse">Loading Studio...</h3>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">Preparing your environment</p>
    </div>
  );
}
