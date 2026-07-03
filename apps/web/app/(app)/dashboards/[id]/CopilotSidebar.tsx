// @ts-nocheck
"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Loader2, Code, FileCode, CheckCircle2 } from "lucide-react";
import { useChat } from "@ai-sdk/react";

interface CopilotSidebarProps {
  dashboardId: string;
  onWidgetCreated?: (widget: any) => void;
}

export default function CopilotSidebar({ dashboardId, onWidgetCreated }: CopilotSidebarProps) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/ai/dashboard/copilot",
    body: {
      dashboardId,
    },
    onToolCall: ({ toolCall }) => {
       if (toolCall.toolName === 'create_widget') {
          // Pass the widget config back up
          onWidgetCreated?.((toolCall.args as any));
       }
    }
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-white/10 w-80 shrink-0">
      <div className="p-4 border-b border-zinc-200 dark:border-white/10 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-violet-500" />
        <h3 className="font-semibold text-zinc-900 dark:text-white">AI Copilot</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-zinc-500 dark:text-zinc-400 p-4 space-y-2">
            <Sparkles className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mb-2" />
            <p className="text-sm">Hi! I can help you build your dashboard.</p>
            <p className="text-xs">Ask me to create a chart showing MRR by month, or a table of recent users.</p>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
            <div
              className={`max-w-[90%] p-3 rounded-2xl text-sm ${
                m.role === "user"
                  ? "bg-violet-600 text-white rounded-br-none"
                  : "bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white rounded-bl-none"
              }`}
            >
              {m.content}
              
              {/* Render Tool Invocations inside the message */}
              {m.toolInvocations?.map((toolInvocation) => {
                 if (toolInvocation.toolName === 'create_widget' && 'result' in toolInvocation) {
                    return (
                       <div key={toolInvocation.toolCallId} className="mt-2 p-2 bg-zinc-200 dark:bg-black/20 rounded-md flex items-center gap-2 text-xs border border-emerald-500/30">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span>Generated widget: {toolInvocation.args.name}</span>
                       </div>
                    )
                 } else if (toolInvocation.toolName === 'create_widget') {
                    return (
                       <div key={toolInvocation.toolCallId} className="mt-2 p-2 bg-zinc-200 dark:bg-black/20 rounded-md flex items-center gap-2 text-xs animate-pulse">
                          <Loader2 className="w-4 h-4 text-violet-500 animate-spin" />
                          <span>Generating widget...</span>
                       </div>
                    )
                 }
                 return null;
              })}
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex items-start">
            <div className="bg-zinc-100 dark:bg-white/10 p-3 rounded-2xl rounded-bl-none text-zinc-900 dark:text-white flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
              <span className="text-sm text-zinc-500">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-zinc-200 dark:border-white/10">
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 p-1 bg-zinc-100 dark:bg-black/20 rounded-full border border-zinc-200 dark:border-white/10 focus-within:ring-2 focus-within:ring-violet-500 focus-within:border-transparent transition-all"
        >
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask AI to build a widget..."
            className="flex-1 bg-transparent px-3 py-1.5 text-sm focus:outline-none text-zinc-900 dark:text-white placeholder:text-zinc-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !(input || "").trim()}
            className="p-1.5 bg-violet-600 text-white rounded-full hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
