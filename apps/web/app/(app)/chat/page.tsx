"use client";

import { useState, useEffect, useRef } from "react";
import { Send, User, Sparkles, Link as LinkIcon, Paperclip, Plus, MessageSquare, Menu, FileText, Image as ImageIcon, Video, Bot, Mic, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReactMarkdown from 'react-markdown';

type Message = {
  role: "user" | "assistant";
  content: string;
};

function cleanMarkdownLocally(markdown: string) {
  return markdown
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^(#|\*|-|>)\s?/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default function ChatPage() {
  const router = useRouter();
  
  const [extractedData, setExtractedData] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Theme State - Default to Light Mode as requested previously
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Apply theme to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    const rawData = sessionStorage.getItem('extractedData');
    if (!rawData) {
      router.push('/');
      return;
    }

    try {
      const parsed = JSON.parse(rawData);
      setExtractedData(parsed);
      
      const rawText = parsed.markdown || parsed.article?.textContent || "No readable text found on this page.";
      const cleaned = cleanMarkdownLocally(rawText);
      const truncated = cleaned.length > 3000 ? cleaned.substring(0, 3000) + "...\n\n*[Content Truncated]*" : cleaned;

      setMessages([
        {
          role: "user",
          content: "DOC_INJECTION"
        },
        {
          role: "assistant",
          content: truncated
        }
      ]);
    } catch (e) {
      console.error(e);
      router.push('/');
    }
  }, [router]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsSending(true);

    try {
      const contextDocument = messages[1]?.content || "";

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'chat', 
          markdown: contextDocument,
          prompt: userMessage 
        })
      });
      const data = await res.json();
      
      if (data.success) {
        setMessages(prev => [...prev, { role: "assistant", content: data.data }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I ran into an error generating a response." }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: "assistant", content: "Network error. Please try again." }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      alert(`File "${file.name}" selected.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (!extractedData) return null;

  return (
    <div className={`flex h-screen overflow-hidden font-sans text-slate-800 dark:text-slate-200 transition-colors duration-500 bg-[#F3F6F9] dark:bg-[#0B0F19] p-3 md:p-5 gap-5`}>
      
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'flex' : 'hidden'} md:flex w-[280px] flex-col shrink-0 absolute md:relative z-20 h-full bg-white dark:bg-[#161C2D] rounded-[24px] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden transition-colors duration-500`}>
        
        {/* Top: New Chat */}
        <div className="pt-6 pb-2 px-4">
          <Link href="/" className="flex items-center justify-between w-full px-5 py-3.5 bg-gradient-to-r from-teal-50 to-indigo-50 dark:from-purple-900/60 dark:to-teal-800/60 rounded-full hover:opacity-90 transition-opacity text-sm font-medium text-slate-700 dark:text-white group border border-slate-200 dark:border-white/5 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
            <div className="flex items-center gap-3">
              <Plus className="w-4 h-4 text-teal-600 dark:text-white" />
              New Chat
            </div>
            <Sparkles className="w-4 h-4 text-indigo-500 dark:text-purple-400 group-hover:text-indigo-600 dark:group-hover:text-purple-300" />
          </Link>
        </div>

        {/* Quick Tools */}
        <div className="px-6 py-4">
          <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 pb-4 uppercase tracking-wider">Quick Tools</div>
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-4 hover:text-slate-600 dark:hover:text-slate-200 text-sm text-slate-500 dark:text-slate-300 font-medium transition-colors">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-white/5">
                <FileText className="w-4 h-4" />
              </div>
              Convert to PDF
            </Link>
            <Link href="/" className="flex items-center gap-4 hover:text-slate-600 dark:hover:text-slate-200 text-sm text-slate-500 dark:text-slate-300 font-medium transition-colors">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-teal-50 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-white/5">
                <ImageIcon className="w-4 h-4" />
              </div>
              Extract Images
            </Link>
            <Link href="/" className="flex items-center gap-4 hover:text-slate-600 dark:hover:text-slate-200 text-sm text-slate-500 dark:text-slate-300 font-medium transition-colors">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-100 dark:border-white/5">
                <Video className="w-4 h-4" />
              </div>
              Video Downloader
            </Link>
          </div>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto py-2 space-y-1 [&::-webkit-scrollbar]:hidden">
          <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 px-6 pb-3 uppercase tracking-wider">Today</div>
          {/* Active Chat */}
          <div className="px-4">
            <button className="w-full flex items-center gap-3 px-5 py-3.5 bg-slate-50 dark:bg-[#25233A] border border-slate-200 dark:border-indigo-500/20 rounded-full text-[14px] text-slate-700 dark:text-slate-200 font-medium text-left dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <MessageSquare className="w-4 h-4 shrink-0 text-indigo-500 dark:text-purple-400" />
              <span className="truncate">{extractedData.article?.title || extractedData.url || 'Current Chat'}</span>
            </button>
          </div>
          
          <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 px-6 pt-6 pb-3 uppercase tracking-wider">Previous 7 Days</div>
          <div className="px-6 space-y-3">
            <button className="w-full flex items-center gap-3 py-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors text-left">
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span className="truncate">Extracting Flutter Docs</span>
            </button>
            <button className="w-full flex items-center gap-3 py-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors text-left">
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span className="truncate">React Context Tutorial</span>
            </button>
          </div>
        </div>

        {/* Theme Toggle & User Profile */}
        <div className="p-4 mt-auto flex flex-col gap-2">
          
          <button 
            onClick={toggleTheme}
            className="flex items-center gap-3 px-4 py-3 rounded-full hover:bg-slate-50 dark:hover:bg-[#252A40] transition-colors text-sm font-medium text-slate-600 dark:text-slate-400"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
          </button>

          <div className="flex items-center gap-3 bg-slate-50 dark:bg-[#1D2133] hover:bg-slate-100 dark:hover:bg-[#252A40] p-3 rounded-full border border-slate-200 dark:border-white/5 transition-colors cursor-pointer group relative shadow-sm dark:shadow-lg">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 flex items-center justify-center text-white dark:text-black font-bold shrink-0 relative border-2 border-white dark:border-[#161C2D]">
              <span>G</span>
              <div className="absolute bottom-[-2px] right-[-2px] w-3 h-3 bg-emerald-400 border-2 border-slate-50 dark:border-[#1D2133] rounded-full"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate text-slate-700 dark:text-white">Guest User</p>
              <p className="text-[11px] text-purple-500 dark:text-purple-400 font-medium truncate flex items-center gap-1 group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                <Sparkles className="w-3 h-3" /> Upgrade to Pro
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative min-w-0 z-10 bg-white dark:bg-[#161C2D] rounded-[24px] border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden transition-colors duration-500">
        
        {/* Top Header */}
        <header className="w-full px-4 md:px-8 pt-4 pb-2 flex gap-4 items-center shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex-1 bg-slate-50 dark:bg-[#232B40] border border-slate-200 dark:border-white/10 rounded-full px-5 py-2.5 flex items-center gap-3 text-[13px] text-slate-600 dark:text-slate-300 shadow-sm transition-colors duration-500">
            <LinkIcon className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">{extractedData.url}</span>
          </div>
          
          <div className="hidden md:flex bg-slate-50 dark:bg-[#232B40] border border-slate-200 dark:border-white/10 rounded-full px-5 py-2.5 items-center gap-2 text-[13px] font-semibold text-slate-700 dark:text-slate-200 shrink-0 shadow-sm transition-colors duration-500">
            <Bot className="w-4 h-4 text-indigo-500 dark:text-white" />
            GenWorkAI
          </div>
        </header>

        {/* Chat Feed */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto scroll-smooth pt-4 pb-40 w-full [&::-webkit-scrollbar]:hidden"
        >
          <div className="max-w-5xl mx-auto flex flex-col gap-8 px-4 md:px-8">
            
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-4 group ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-cyan-500 text-white' 
                    : 'bg-gradient-to-tr from-indigo-500 to-purple-500 dark:from-cyan-400 dark:to-blue-500 text-white'
                }`}>
                  {msg.role === 'user' 
                    ? <User className="w-4 h-4" /> 
                    : <Sparkles className="w-4 h-4" />
                  }
                </div>
                
                <div className={`flex-1 overflow-hidden ${msg.role === 'user' ? 'flex flex-col items-end' : ''}`}>
                  {msg.role === 'user' ? (
                    <div className="bg-slate-100 dark:bg-[#2A3245] px-5 py-4 rounded-[20px] rounded-tr-sm border border-slate-200 dark:border-white/10 shadow-sm min-w-[280px] transition-colors duration-500">
                      {msg.content === "DOC_INJECTION" ? (
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2 text-[13px] font-medium text-purple-600 dark:text-purple-300">
                            <Paperclip className="w-3.5 h-3.5" />
                            Extracted Document
                          </div>
                          <span className="text-[14px] text-slate-800 dark:text-slate-200 truncate max-w-md block font-medium">
                            {extractedData.url}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[14px] text-slate-800 dark:text-slate-200">{msg.content}</span>
                      )}
                    </div>
                  ) : (
                    <div className="max-w-[85%] bg-slate-50 dark:bg-[#1E2638] px-7 py-6 rounded-[24px] rounded-tl-sm text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 shadow-sm transition-colors duration-500">
                      <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-indigo-500 dark:prose-a:text-cyan-400 text-[14px] leading-relaxed break-words">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isSending && (
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 dark:from-cyan-400 dark:to-blue-500 flex items-center justify-center shrink-0 text-white shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1 pt-2">
                  <div className="bg-slate-50 dark:bg-[#1E2638] px-6 py-4 rounded-[20px] rounded-tl-sm border border-slate-200 dark:border-white/10 inline-block shadow-sm transition-colors duration-500">
                    <div className="flex gap-1.5 items-center h-4">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
          </div>
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white dark:from-[#161C2D] dark:via-[#161C2D] to-transparent pt-12 pb-8 px-4 md:px-8 z-20 transition-colors duration-500">
          <div className="max-w-5xl mx-auto relative">
            <form 
              onSubmit={handleSendMessage} 
              className="relative bg-white dark:bg-[#232B40] rounded-[24px] shadow-lg dark:shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden transition-all flex items-center pr-2"
            >
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 ml-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#2A3245] rounded-full transition-colors shrink-0"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt"
              />

              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder="Message GenWorkAI..."
                disabled={isSending}
                rows={1}
                className="flex-1 py-4 px-3 max-h-[200px] bg-transparent outline-none resize-none disabled:opacity-50 text-slate-800 dark:text-slate-200 text-[15px] placeholder-slate-400 dark:placeholder-slate-500 [&::-webkit-scrollbar]:hidden leading-normal"
                style={{ fieldSizing: 'content' } as any}
              />
              
              <div className="flex items-center gap-1">
                <button 
                  type="button"
                  className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#2A3245] rounded-full transition-colors shrink-0"
                >
                  <Mic className="w-5 h-5" />
                </button>
                <button 
                  type="submit" 
                  disabled={!input.trim() || isSending}
                  className={`p-2.5 rounded-full transition-all shrink-0 ${
                    input.trim() && !isSending 
                      ? 'bg-gradient-to-tr from-indigo-500 to-purple-500 dark:from-blue-500 dark:to-indigo-500 text-white shadow-lg' 
                      : 'bg-slate-100 dark:bg-[#2A3245] text-slate-400 dark:text-slate-500'
                  }`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
