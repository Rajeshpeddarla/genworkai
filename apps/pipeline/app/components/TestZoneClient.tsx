"use client";

import { useState, useRef, useEffect } from "react";
import { UploadCloud, File, AlertTriangle, FileText, Bot, Send, User, Terminal } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from "framer-motion";

export default function TestZoneClient() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Pipeline status
  const [status, setStatus] = useState<"idle" | "uploading" | "extracting" | "complete">("idle");
  const [extractedContent, setExtractedContent] = useState<string | null>(null);
  const [assets, setAssets] = useState<Record<string, string>>({});

  // Chat Arena
  const [chatMessages, setChatMessages] = useState<{role: 'user'|'bot', content: string}[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    setError(null);
    if (!selected) return;
    
    if (selected.size > 3 * 1024 * 1024) {
      setError("FILE_EXCEEDS_TEST_LIMIT_3MB");
      setFile(null);
      return;
    }
    
    if (selected.type !== "application/pdf") {
      setError("INVALID_FORMAT_EXPECTED_PDF");
      setFile(null);
      return;
    }
    
    setFile(selected);
  };

  const startTest = async () => {
    if (!file) return;
    
    setStatus("uploading");
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploadRes = await fetch("/api/v1/parse", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload document");
      }

      setStatus("extracting");

      const uploadData = await uploadRes.json();
      
      if (uploadData.error) {
        throw new Error(uploadData.error);
      }

      // Our new V1 parse returns extractedData directly
      const docData = uploadData.extractedData || uploadData;
      
      let markdownOutput = "";
      if (docData.pages && Array.isArray(docData.pages)) {
         markdownOutput = docData.pages.map((p: any) => p.markdown || p.text).join("\\n\\n");
      } else {
         markdownOutput = JSON.stringify(docData, null, 2);
      }

      setExtractedContent(markdownOutput);
      
      // If we have images in the new JSON structure, we could map them to assets, but for now we just show markdown
      setAssets({});
      
      setStatus("complete");
      setChatMessages([
        { role: "bot", content: "INGESTION_COMPLETE. Visual diagrams and structure extracted via Document Intelligence API. Ready for queries." }
      ]);

    } catch (err: any) {
      setError(err.message || "UNKNOWN_ERROR");
      setStatus("idle");
    }
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !extractedContent) return;
    
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatInput("");
    
    // Add a temporary loading message
    setChatMessages(prev => [...prev, { role: 'bot', content: "..." }]);
    
    try {
      const res = await fetch("/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: 'user', content: userMsg }], documentText: extractedContent }),
      });
      
      const data = await res.json();
      
      setChatMessages(prev => {
        const newMessages = [...prev];
        // Replace the "..." with the actual response
        newMessages[newMessages.length - 1] = { 
          role: 'bot', 
          content: data.content || data.error || "An error occurred." 
        };
        return newMessages;
      });
      
    } catch (error) {
      setChatMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { role: 'bot', content: "Failed to connect to AI Node." };
        return newMessages;
      });
    }
  };

  return (
    <div className="w-full relative z-10 font-mono">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 relative z-10 font-mono">
        
        {/* Upload Column */}
        <div className="xl:col-span-1 bg-black border border-white/10 p-8 shadow-[0_0_30px_rgba(0,240,255,0.05)] flex flex-col h-[700px] relative overflow-hidden group">
          
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity">
            <Terminal className="w-8 h-8 text-cyan-500" />
          </div>

          <h2 className="text-xl font-bold mb-6 flex items-center gap-3 font-pixel text-cyan-400 uppercase">
            <UploadCloud className="w-6 h-6" />
            Ingestion Node 
          </h2>
          
          <div className="border border-dashed border-white/20 p-10 text-center bg-[#050505] mb-6 hover:border-cyan-500/50 transition-colors cursor-crosshair">
            <input 
              type="file" 
              accept=".pdf" 
              onChange={handleFileChange} 
              className="hidden" 
              id="test-upload" 
            />
            <label 
              htmlFor="test-upload"
              className="cursor-crosshair flex flex-col items-center justify-center"
            >
              <File className="w-16 h-16 text-zinc-600 mb-4" />
              <span className="font-bold text-white mb-2 text-lg uppercase tracking-widest">Select Target PDF</span>
              <span className="text-xs text-zinc-500 uppercase tracking-widest">Max 3MB // Unstructured Data Only</span>
            </label>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex items-start gap-3 p-4 bg-red-950/30 text-red-400 border border-red-900/50 text-xs uppercase tracking-widest mb-6">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <p>{error}</p>
              </motion.div>
            )}

            {file && !error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex items-center justify-between p-4 bg-cyan-950/20 text-cyan-300 mb-6 border border-cyan-900/50 text-sm">
                <div className="flex items-center gap-3 truncate">
                  <FileText className="w-5 h-5 shrink-0" />
                  <span className="truncate font-bold">{file.name}</span>
                </div>
                <span className="shrink-0">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            disabled={!file || status === "uploading" || status === "extracting"}
            onClick={startTest}
            className="w-full mt-auto py-4 bg-cyan-500 hover:bg-cyan-400 disabled:bg-zinc-900 disabled:text-zinc-600 text-black font-pixel text-xl uppercase transition-colors"
          >
            {status === "uploading" ? "UPLOADING..." : status === "extracting" ? "EXTRACTING..." : status === "complete" ? "RESTART_NODE" : "EXECUTE"}
          </button>
        </div>

        {/* Output / Chat Column */}
        <div className="xl:col-span-2 bg-[#050505] border border-white/10 overflow-hidden shadow-2xl flex flex-col h-[700px] relative">
          
          {/* Header */}
          <div className="flex border-b border-white/10 bg-black/50">
            <div className="flex-1 py-3 px-4 font-bold text-cyan-400 border-b-2 border-cyan-400 bg-cyan-950/20 text-xs uppercase tracking-[0.2em]">
              Output Arena // Chat Interface
            </div>
          </div>
          
          <div className="flex-1 flex flex-col overflow-hidden relative">
            
            {status === "idle" && (
              <div className="h-full flex flex-col items-center justify-center text-zinc-600">
                <Bot className="w-16 h-16 mb-6 opacity-20" />
                <p className="text-sm font-medium uppercase tracking-widest">Awaiting payload injection...</p>
              </div>
            )}
            
            {(status === "uploading" || status === "extracting") && (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                <div className="w-16 h-16 border border-cyan-500/20 rounded-sm relative mb-6">
                  <motion.div animate={{ height: ["0%", "100%", "0%"] }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute bottom-0 w-full bg-cyan-500/50" />
                </div>
                <p className="text-sm font-medium uppercase tracking-widest text-cyan-400 animate-pulse">
                  {status === "uploading" ? "ESTABLISHING SECURE LINK..." : "VLM REASONING ACTIVE..."}
                </p>
              </div>
            )}
            
            {status === "complete" && extractedContent && (
              <div className="flex flex-col h-full">
                
                {/* Document Preview (Top Half) */}
                <div className="flex-1 p-6 overflow-y-auto border-b border-white/10 custom-scrollbar bg-black">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-500/10 text-violet-400 text-[10px] uppercase tracking-widest font-bold mb-6 border border-violet-500/20">
                    <FileText className="w-3 h-3" /> Extracted Markdown
                  </div>
                  <div className="prose prose-invert prose-cyan max-w-none text-sm font-sans">
                    <ReactMarkdown
                      components={{
                        img: ({ node, src, alt, ...props }) => {
                          if (typeof src === 'string' && src.startsWith('asset://')) {
                            const uuid = src.replace('asset://', '');
                            const b64 = assets[uuid];
                            if (b64) {
                              return (
                                <div className="my-6 relative border border-cyan-500/30 p-2 bg-[#050505]">
                                  <div className="absolute top-0 right-0 bg-cyan-500 text-black text-[10px] font-mono px-2 py-0.5">BASE64_ASSET</div>
                                  <img src={b64} alt={alt} className="relative max-w-full" />
                                </div>
                              );
                            }
                          }
                          return src ? <img src={src} alt={alt || ""} {...props} /> : null;
                        }
                      }}
                    >
                      {extractedContent}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* Chat Arena (Bottom Half) */}
                <div className="h-[300px] flex flex-col bg-[#050505]">
                  <div className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-4">
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}>
                        <div className={`w-8 h-8 flex items-center justify-center shrink-0 border ${msg.role === 'user' ? 'bg-zinc-800 border-white/10' : 'bg-cyan-950 border-cyan-500/50 text-cyan-400'}`}>
                          {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>
                        <div className={`p-3 text-xs leading-relaxed border ${msg.role === 'user' ? 'bg-zinc-900 border-white/10 text-zinc-300' : 'bg-black border-cyan-900/50 text-cyan-100'}`}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="p-4 border-t border-white/10 bg-black">
                    <form onSubmit={handleChat} className="flex gap-2">
                      <input 
                        type="text" 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="> QUERY_PAYLOAD..." 
                        className="flex-1 bg-[#050505] border border-white/10 px-4 py-3 text-xs text-cyan-400 focus:outline-none focus:border-cyan-500 transition-colors uppercase placeholder:text-zinc-700"
                      />
                      <button type="submit" disabled={!chatInput.trim()} className="bg-cyan-500 hover:bg-cyan-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-black px-6 transition-colors">
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
