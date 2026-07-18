"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, FileText, Loader2, CheckCircle2, ChevronRight, X, Send, Bot, User, AlertCircle, Code2, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "model";
  content: string;
}

export default function ExtractNodePage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const selectedFile = e.dataTransfer.files[0];
      if (selectedFile.type === "application/pdf") {
        setFile(selectedFile);
        resetState();
      } else {
        setError("Only PDF files are currently supported for extraction.");
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      resetState();
    }
  };

  const resetState = () => {
    setExtractedData(null);
    setError(null);
    setMessages([]);
  };

  const clearFile = () => {
    setFile(null);
    resetState();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/v1/parse", {
        method: "POST",
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to extract document");
      }
      
      setExtractedData(data.extractedData);
      setMessages([
        { role: "model", content: "Document successfully parsed! You can now ask me questions about it." }
      ]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !extractedData) return;
    
    const userMsg = inputValue.trim();
    setInputValue("");
    
    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userMsg }
    ];
    
    setMessages(newMessages);
    setIsChatting(true);
    
    try {
      const response = await fetch("/api/v1/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: newMessages,
          documentText: extractedData.content[0].text
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }
      
      setMessages([...newMessages, { role: "model", content: data.content }]);
    } catch (err: any) {
      setMessages([
        ...newMessages,
        { role: "model", content: `**Error:** ${err.message}` }
      ]);
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6">
      
      {/* Upload Zone (Left Side) */}
      {!extractedData && (
        <div className="w-full max-w-xl mx-auto flex flex-col transition-all duration-500">
          <div className="mb-6">
            <h1 className="font-pixel text-2xl uppercase tracking-wider mb-2 text-black dark:text-white">Testing Arena</h1>
            <p className="font-mono text-zinc-500 text-xs uppercase tracking-widest mb-4">
              Drop payload for processing
            </p>
            <div className="p-3 border border-yellow-500/30 bg-yellow-500/10 text-xs text-yellow-700 dark:text-yellow-400 font-mono flex items-start gap-2 rounded-md">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span><strong>WARNING:</strong> This arena is for testing only. Once you close this tab, refresh, or log out, all extracted data and chat history related to this session will be permanently lost.</span>
            </div>
          </div>
        <div className={`flex-1 border bg-zinc-50 dark:bg-[#050505] p-6 relative flex flex-col transition-all duration-300 ${extractedData ? 'border-zinc-200 dark:border-white/10 rounded-lg max-h-[300px]' : 'border-zinc-300 dark:border-white/10'}`}>
          {error && (
            <div className="mb-4 p-3 border border-red-500/30 bg-red-500/10 text-xs text-red-600 dark:text-red-400 font-mono flex items-center justify-between">
              <span>[ERR] {error}</span>
              <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
            </div>
          )}

          {!file ? (
            <div 
              className={`flex-1 min-h-[200px] border-2 border-dashed flex flex-col items-center justify-center transition-colors cursor-pointer group rounded-lg ${
                isDragging ? "border-cyan-600 dark:border-cyan-400 bg-cyan-50 dark:bg-cyan-400/5" : "border-zinc-300 dark:border-white/10 hover:border-zinc-400 dark:hover:border-white/30 hover:bg-zinc-100 dark:hover:bg-white/5"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="p-4 bg-zinc-200 dark:bg-white/5 rounded-full mb-4 group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6 text-zinc-500 dark:text-zinc-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors" />
              </div>
              <p className="font-pixel text-sm uppercase tracking-wider text-black dark:text-white mb-2">Upload File</p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                PDF Documents
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center">
              <div className="border border-zinc-200 dark:border-white/10 bg-white dark:bg-black p-4 flex flex-col items-center justify-center text-center rounded-lg">
                <FileText className="w-8 h-8 text-cyan-600 dark:text-cyan-400 mb-3" />
                <h3 className="font-mono text-sm text-black dark:text-white mb-1 break-all line-clamp-2">{file.name}</h3>
                <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest mb-4">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                
                {!isUploading && !extractedData && (
                  <button onClick={clearFile} className="text-zinc-500 hover:text-red-600 dark:hover:text-red-400 font-mono text-xs uppercase tracking-widest transition-colors">
                    Remove payload
                  </button>
                )}
                
                {extractedData && (
                  <button onClick={clearFile} className="mt-2 w-full px-4 py-2 border border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5 font-mono text-xs uppercase tracking-widest transition-colors text-black dark:text-white rounded">
                    New Document
                  </button>
                )}
              </div>
              
              {!extractedData && (
                <button 
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="w-full mt-4 bg-[#014b5c] dark:bg-cyan-500 hover:bg-[#013b4c] dark:hover:bg-cyan-400 text-white dark:text-black py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 uppercase tracking-widest text-xs"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Initialize Extraction <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          <input 
            type="file" 
            accept="application/pdf"
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileSelect}
          />
        </div>
        </div>
      )}

      {/* Extracted Data / Chat (Right Side) */}
      <AnimatePresence>
        {extractedData && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 flex flex-col min-h-0"
          >
            <div className="flex-1 border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#050505] rounded-lg overflow-hidden flex flex-col shadow-sm">
              {/* Chat Header */}
              <div className="h-10 border-b border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-black/50 flex items-center px-4 shrink-0 justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">Analysis Chat Link</span>
                <button onClick={clearFile} className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 hover:text-red-600 dark:hover:text-red-400">Close Session</button>
              </div>
              
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'model' && (
                      <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-cyan-700 dark:text-cyan-400" />
                      </div>
                    )}
                    
                    <div className={`max-w-[80%] rounded-lg p-3 text-sm ${
                      msg.role === 'user' 
                        ? 'bg-[#014b5c] dark:bg-cyan-500 text-white dark:text-black rounded-tr-none' 
                        : 'bg-white dark:bg-black border border-zinc-200 dark:border-white/10 text-zinc-800 dark:text-zinc-200 rounded-tl-none prose dark:prose-invert max-w-none'
                    }`}>
                      {msg.role === 'user' ? (
                        msg.content
                      ) : (
                        <ReactMarkdown 
                          components={{
                            img: ({node, ...props}) => <img className="rounded-md max-w-full h-auto border border-zinc-200 dark:border-white/10 my-2" {...props} />
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      )}
                    </div>
                    
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                      </div>
                    )}
                  </div>
                ))}
                
                {isChatting && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-cyan-700 dark:text-cyan-400" />
                    </div>
                    <div className="bg-white dark:bg-black border border-zinc-200 dark:border-white/10 rounded-lg rounded-tl-none p-4 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"></div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-3 border-t border-zinc-200 dark:border-white/10 bg-white dark:bg-black shrink-0">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                  className="flex gap-2 relative"
                >
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask a question about the document..."
                    disabled={isChatting}
                    className="flex-1 bg-zinc-50 dark:bg-[#050505] border border-zinc-200 dark:border-white/10 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 disabled:opacity-50 text-black dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || isChatting}
                    className="bg-[#014b5c] dark:bg-cyan-500 hover:bg-[#013b4c] dark:hover:bg-cyan-400 text-white dark:text-black p-2.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
