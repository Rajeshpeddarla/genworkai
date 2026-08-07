"use client";

import { RequestLogsTable } from "../api-docs/RequestLogsTable";

export default function LogsPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="text-left mb-8">
        <h1 className="font-pixel text-3xl uppercase tracking-wider mb-2">All Request Logs</h1>
        <p className="font-mono text-zinc-400 text-sm">
          Complete history of your API executions and processing events.
        </p>
      </div>

      <RequestLogsTable />
    </div>
  );
}
