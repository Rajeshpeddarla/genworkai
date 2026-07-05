// @ts-nocheck
"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Loader2, CheckCircle2, Square, X } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

interface CopilotSidebarProps {
  dashboardId: string;
  onWidgetCreated?: (widget: any) => void;
  onRefresh?: () => void;
  onClose?: () => void;
}

export default function CopilotSidebar({ dashboardId, onWidgetCreated, onRefresh, onClose }: CopilotSidebarProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [width, setWidth] = useState(320);
  const isResizing = useRef(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      // Calculate new width based on mouse X position
      // Width grows as mouse moves left, because sidebar is docked right
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 280 && newWidth <= 800) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = 'default';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;

    const userMessage = { id: Date.now().toString(), role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsGenerating(true);

    try {
      const res = await fetch("/api/ai/dashboard/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dashboardId, messages: newMessages })
      });

      if (!res.ok) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: "assistant", content: `Error: Request failed with status ${res.status}` }]);
        setIsGenerating(false);
        return;
      }

      if (!res.body) throw new Error("No response body");

      const assistantMessageId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: assistantMessageId, role: "assistant", content: "" }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;
      let textBuffer = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('0:')) {
              try {
                textBuffer += JSON.parse(line.substring(2));
              } catch (e) {}
            } else if (line.trim().length > 0 && !line.startsWith('1:') && !line.startsWith('2:') && !line.startsWith('3:')) {
               textBuffer += line + "\n";
            }
          }
          setMessages(prev => prev.map(m => m.id === assistantMessageId ? { ...m, content: textBuffer } : m));
        }
      }
      
      // Since the backend now automatically creates the widget, just tell the parent to refresh!
      setTimeout(() => {
        if (textBuffer.includes("```json") || textBuffer.includes("SELECT") || textBuffer.includes("widget")) {
           // Append a success message
           setMessages(prev => [...prev, { id: Date.now().toString(), role: "assistant", content: "✅ Widget generated successfully!" }]);
           // Instead of a hard page reload which clears chat history, we use the onRefresh callback
           if (onRefresh) {
             onRefresh();
           } else {
             window.location.reload();
           }
        }
      }, 500);

    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: "assistant", content: `Error: ${err.message}` }]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div 
      className="flex flex-col h-full bg-card border-l border-zinc-200 dark:border-white/10 shrink-0 relative"
      style={{ width: `${width}px` }}
    >
      {/* Resizer Handle */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-violet-500/50 z-50 transition-colors"
        onMouseDown={(e) => {
          e.preventDefault();
          isResizing.current = true;
          document.body.style.cursor = 'col-resize';
        }}
      />

      <div className="p-4 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-500" />
          <h3 className="font-semibold text-foreground">AI Copilot</h3>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-md hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-zinc-500 dark:text-zinc-400 p-4 space-y-2">
            <Sparkles className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mb-2" />
            <p className="text-sm">Hi! I can help you build your dashboard.</p>
            <p className="text-xs">Ask me to create a chart showing MRR by month, or a table of recent users.</p>
          </div>
        )}

        {messages.map((m: any) => (
          <div key={m.id} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
            <div
              className={`max-w-[90%] p-3 rounded-2xl text-sm ${
                m.role === "user"
                  ? "bg-violet-600 text-white rounded-br-none"
                  : "bg-zinc-100 dark:bg-white/10 text-foreground rounded-bl-none"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        
        {isGenerating && messages[messages.length - 1]?.role === "user" && (
          <div className="flex items-start">
            <div className="bg-zinc-100 dark:bg-white/10 p-3 rounded-2xl rounded-bl-none text-foreground flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
              <span className="text-sm text-zinc-500">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-zinc-200 dark:border-white/10">
        <form
          onSubmit={handleManualSubmit}
          className="flex items-center gap-2 p-1 bg-zinc-100 dark:bg-black/20 rounded-full border border-zinc-200 dark:border-white/10 focus-within:ring-2 focus-within:ring-violet-500 focus-within:border-transparent transition-all"
        >
          <input
            name="prompt"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI to build a widget..."
            className="flex-1 bg-transparent px-3 py-1.5 text-sm focus:outline-none text-foreground placeholder:text-zinc-500"
            disabled={isGenerating}
          />
          <button
            type="submit"
            className="p-1.5 bg-violet-600 text-white rounded-full hover:bg-violet-700 transition-colors"
          >
            {isGenerating ? <Square className="w-4 h-4 fill-current" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>

    </div>
  );
}
