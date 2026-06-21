"use client";

import { useState } from "react";
import { Shield, Settings, Clock, User, FileJson } from "lucide-react";

export default function SettingsClient({ initialLogs }: { initialLogs: any[] }) {
  const [activeTab, setActiveTab] = useState("audit");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Admin Settings</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Platform configuration and security audit logs.</p>
        </div>
      </div>

      <div className="flex space-x-1 p-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("audit")}
          className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-all ${
            activeTab === "audit"
              ? "bg-rose-600 text-white shadow-md"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <Clock className="w-4 h-4" /> Audit Logs
        </button>
        <button
          onClick={() => setActiveTab("general")}
          className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-all ${
            activeTab === "general"
              ? "bg-rose-600 text-white shadow-md"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <Settings className="w-4 h-4" /> General Settings
        </button>
      </div>

      {activeTab === "audit" && (
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-sm text-zinc-500 dark:text-zinc-400">
            <thead className="text-xs text-zinc-700 dark:text-zinc-300 uppercase bg-zinc-50 dark:bg-white/5 border-b border-zinc-200 dark:border-white/10">
              <tr>
                <th className="px-6 py-4 font-medium">Admin / System</th>
                <th className="px-6 py-4 font-medium">Action</th>
                <th className="px-6 py-4 font-medium">Entity</th>
                <th className="px-6 py-4 font-medium">Time</th>
                <th className="px-6 py-4 text-right font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {initialLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">No audit logs found.</td>
                </tr>
              )}
              {initialLogs.map(log => (
                <tr key={log.id} className="border-b border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/5">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-medium">
                      {!log.adminName ? <Shield className="w-4 h-4 text-emerald-500" /> : <User className="w-4 h-4 text-rose-500" />}
                      {log.adminName || 'System'}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-zinc-900 dark:text-white">
                    {log.action}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-zinc-600 dark:text-zinc-300">
                      {log.entityType} : {log.entityId}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200" title={JSON.stringify(log.newValue)}>
                      <FileJson className="w-5 h-5 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "general" && (
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-2xl p-8">
           <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">Platform Settings</h3>
           <p className="text-zinc-500">Settings and configuration goes here.</p>
        </div>
      )}
    </div>
  );
}
