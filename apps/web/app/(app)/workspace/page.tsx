"use client";

import { useState, useEffect, useRef } from "react";
import { PremiumUpgradeDialog } from "@/components/billing/PremiumUpgradeDialog";
import { MessageSquare, Download, FileText, File, Send, Database, LayoutDashboard, BrainCircuit, Mail, Presentation, Type, GripVertical, PanelLeftClose, PanelLeftOpen, Plus } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { PdfViewer } from "../../../components/knowledge/PdfViewer";
import { Panel, PanelGroup, PanelResizeHandle, ImperativePanelHandle } from "react-resizable-panels";

export default function WorkspacePage() {
  const [kbs, setKbs] = useState<any[]>([]);
  const [selectedKb, setSelectedKb] = useState("");
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [pdfCitationUrl, setPdfCitationUrl] = useState<string | null>(null);
  
  const [chats, setChats] = useState<any[]>([]);
  const [artifacts, setArtifacts] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [isChatHistoryCollapsed, setIsChatHistoryCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({ chats: true, artifacts: true });
  const [aiCosts, setAiCosts] = useState<any[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatHistoryPanelRef = useRef<ImperativePanelHandle>(null);
  const previewContentRef = useRef<HTMLDivElement>(null);
  const skipFetchOnceRef = useRef(false);

  // Load KBs and Chats on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      const [kbRes, chatsRes, artifactsRes, costsRes] = await Promise.all([
        fetch('/api/knowledge/list'),
        fetch('/api/workspace/chats'),
        fetch('/api/workspace/artifacts'),
        fetch('/api/billing/costs')
      ]);

      if (kbRes.ok) {
        const kbData = await kbRes.json();
        setKbs(kbData.kbs || []);
      }
      
      if (chatsRes.ok) {
        const chatsData = await chatsRes.json();
        setChats(chatsData.chats || []);
      }

      if (artifactsRes.ok) {
        const artifactsData = await artifactsRes.json();
        setArtifacts(artifactsData.artifacts || []);
      }

      if (costsRes.ok) {
        const costsData = await costsRes.json();
        setAiCosts(costsData.costs || []);
      }
    };
    fetchInitialData();
  }, []);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  // Fetch messages when activeChatId changes
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }

    if (skipFetchOnceRef.current) {
      skipFetchOnceRef.current = false;
      return;
    }

    // Clear messages so the UI updates immediately to show we're loading a different chat
    setMessages([]);

    const fetchChatDetails = async () => {
      const res = await fetch(`/api/workspace/chats/${activeChatId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setSelectedKb(data.chat.kbId ? data.chat.kbId.toString() : "");
      }
    };
    fetchChatDetails();
  }, [activeChatId]);

  const handleNewChat = () => {
    setActiveChatId(null);
    setMessages([]);
    setPreviewDoc(null);
    setPrompt("");
  };

  const handleSend = async () => {
    if (!prompt.trim()) return;

    let currentChatId = activeChatId;
    
    // Optimistic UI for user message
    const tempUserMessage = { role: "user", content: prompt };
    setMessages(prev => [...prev, tempUserMessage]);
    setPrompt("");
    setIsGenerating(true);

    try {
      // 1. Create chat if it doesn't exist
      if (!currentChatId) {
        const title = prompt.length > 30 ? prompt.substring(0, 30) + '...' : prompt;
        const res = await fetch('/api/workspace/chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, kbId: selectedKb ? parseInt(selectedKb) : null })
        });
        const data = await res.json();
        if (data.success) {
          currentChatId = data.chat.id;
          skipFetchOnceRef.current = true;
          setActiveChatId(currentChatId);
          setChats(prev => [data.chat, ...prev]);
        } else {
          throw new Error(data.error);
        }
      }

      // 2. Send message to chat
      let finalContent = tempUserMessage.content;
      if (previewDoc) {
        finalContent = `[Editing Artifact: ${previewDoc.title} (v${previewDoc.version}) ID: ${previewDoc.id}]\n\n${finalContent}`;
      }

      const res = await fetch(`/api/workspace/chats/${currentChatId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: finalContent })
      });
      
      if (!res.ok) {
         if (res.status === 403) {
            const errorData = await res.json().catch(() => ({}));
            if (errorData.code === 'INSUFFICIENT_AI_CREDITS') {
               setShowUpgradeModal(true);
               // Remove the user's message from the UI since it failed
               setMessages(prev => prev.slice(0, -1));
               setIsGenerating(false);
               return;
            }
         }
         
         setMessages(prev => [...prev, { role: "assistant", content: `Error: Request failed with status ${res.status}` }]);
         setIsGenerating(false);
         return;
      }

      if (!res.body) {
        throw new Error("No response body");
      }

      // Add a placeholder assistant message that we will stream into
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMsg = newMessages[newMessages.length - 1];
            if (lastMsg && lastMsg.role === "assistant") {
              newMessages[newMessages.length - 1] = {
                ...lastMsg,
                content: lastMsg.content + chunk
              };
            }
            return newMessages;
          });
        }
      }

      // Refresh artifacts and chats list to update timestamps and load any new artifacts saved by onFinish
      const [artifactsRes, chatsRes] = await Promise.all([
        fetch('/api/workspace/artifacts'),
        fetch('/api/workspace/chats')
      ]);

      if (artifactsRes.ok) {
        const artifactsData = await artifactsRes.json();
        const currentArtifacts = artifactsData.artifacts || [];
        setArtifacts(currentArtifacts);
        
        // If a new artifact was created, we can just grab the latest one for the preview if needed
        // but for now, we just refresh the list.
      }
      
      if (chatsRes.ok) {
        const chatsData = await chatsRes.json();
        setChats(chatsData.chats || []);
      }

    } catch (e: any) {
      if (e.message && e.message !== 'Failed to fetch' && !e.message.includes('network')) {
        alert(e.message);
        // Remove the user message since it failed
        setMessages(prev => prev.slice(0, -1));
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error querying the workspace." }]);
      }
    }

    setIsGenerating(false);
  };

  const handleExport = async (format: string) => {
    if (!previewDoc) return;
    try {
       const content = previewDoc.content || '';
       const title = previewDoc.title || 'document';

       if (['TXT', 'JSON', 'MD', 'CSV', 'SQL', 'HTML'].includes(format)) {
         const blob = new Blob([content], { type: 'text/plain' });
         const url = URL.createObjectURL(blob);
         const a = document.createElement('a');
         a.href = url;
         a.download = `${title}.${format.toLowerCase()}`;
         a.click();
         URL.revokeObjectURL(url);
       } 
       else if (format === 'PDF') {
         // @ts-ignore
         const html2pdf = (await import('html2pdf.js')).default;
         if (previewContentRef.current) {
           const opt = {
             margin:       0.5,
             filename:     `${title}.pdf`,
             image:        { type: 'jpeg', quality: 0.98 },
             html2canvas:  { scale: 2, useCORS: true },
             jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' },
             pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
           };
           // Temporarily remove dark mode classes for clean PDF print
           const clone = previewContentRef.current.cloneNode(true) as HTMLElement;
           clone.className = "prose prose-sm max-w-none p-8 bg-white text-black";
           html2pdf().set(opt as any).from(clone).save();
         }
       }
       else if (format === 'DOCX') {
         const { Document, Packer, Paragraph, TextRun } = await import("docx");
         
         const paragraphs = content.split('\n').map((line: string) => {
          if (line.startsWith('# ')) {
             return new Paragraph({ text: line.replace('# ', ''), heading: "Heading1", spacing: { before: 240, after: 120 } });
          } else if (line.startsWith('## ')) {
             return new Paragraph({ text: line.replace('## ', ''), heading: "Heading2", spacing: { before: 240, after: 120 } });
          } else if (line.startsWith('### ')) {
             return new Paragraph({ text: line.replace('### ', ''), heading: "Heading3", spacing: { before: 200, after: 100 } });
          } else if (line.startsWith('- ')) {
             return new Paragraph({ text: line.replace('- ', ''), bullet: { level: 0 }, spacing: { before: 60, after: 60 } });
          } else if (line.trim() === '') {
             return new Paragraph({ text: "", spacing: { before: 120, after: 120 } });
          } else {
             // Basic bold parsing: split by **
             const parts = line.split('**');
             const runs = parts.map((part, i) => new TextRun({ text: part, bold: i % 2 === 1 }));
             return new Paragraph({ children: runs, spacing: { before: 120, after: 120 } });
          }
         });
         
         const doc = new Document({
            sections: [{
              properties: {},
              children: paragraphs
            }]
         });
         const blob = await Packer.toBlob(doc);
         const url = URL.createObjectURL(blob);
         const a = document.createElement('a');
         a.href = url;
         a.download = `${title}.docx`;
         a.click();
         URL.revokeObjectURL(url);
       }
       else if (format === 'PPTX') {
         // @ts-ignore
         const pptxgen = (await import("pptxgenjs")).default;
         const pres = new pptxgen();
         
         // Title Slide
         const titleSlide = pres.addSlide();
         titleSlide.background = { color: "F3F4F6" };
         titleSlide.addText(title.toUpperCase(), { x: 1, y: 2, w: '80%', h: 1.5, fontSize: 32, bold: true, align: 'center', color: '111827' });
         titleSlide.addText("Generated by Workspace Intelligence", { x: 1, y: 3.5, w: '80%', h: 0.5, fontSize: 14, italic: true, align: 'center', color: '6B7280' });

         // Parse sections by Markdown Headings
         const sections = content.split(/(?=^##? )/m); // Split by H1 or H2 keeping the delimiter

         sections.forEach((section: string) => {
           if (!section.trim()) return;
           
           const slide = pres.addSlide();
           slide.background = { color: "FFFFFF" };
           
           const lines = section.split('\n');
           let heading = (lines[0] || '').replace(/^#+\s/, '').trim() || 'Overview';
           const bodyText = lines.slice(1).join('\n').trim().replace(/\*\*/g, ''); // basic cleanup
           
           // Header
           slide.addText(heading, { x: 0.5, y: 0.5, w: '90%', h: 0.8, fontSize: 24, bold: true, color: '8B5CF6' }); // Violet color
           
           // Body Content
           if (bodyText) {
             slide.addText(bodyText.substring(0, 1500), { x: 0.5, y: 1.5, w: '90%', h: '75%', fontSize: 14, align: 'left', valign: 'top', color: '374151' });
           }
         });
         
         pres.writeFile({ fileName: `${title}.pptx` });
       }
       else if (format === 'XLSX') {
         const XLSX = await import("xlsx");
         const ws = XLSX.utils.aoa_to_sheet([[content]]);
         const wb = XLSX.utils.book_new();
         XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
         XLSX.writeFile(wb, `${title}.xlsx`);
       }
    } catch(e) {
      console.error("Export failed:", e);
      alert("Failed to export document. Check console.");
    }
  };

  const handleExportChat = async (format: string) => {
    if (!messages || messages.length === 0) return;
    try {
       const activeChat = chats.find(c => c.id === activeChatId);
       const title = activeChat ? activeChat.title : 'chat_history';
       
       let content = '';
       messages.forEach(msg => {
         const roleName = msg.role === 'user' ? 'User' : 'Assistant';
         content += `## ${roleName}\n${msg.content}\n\n`;
       });

       if (format === 'MD') {
         const blob = new Blob([content], { type: 'text/plain' });
         const url = URL.createObjectURL(blob);
         const a = document.createElement('a');
         a.href = url;
         a.download = `${title}.md`;
         a.click();
         URL.revokeObjectURL(url);
       } 
       else if (format === 'DOCX') {
         const { Document, Packer, Paragraph, TextRun } = await import("docx");
         
         const paragraphs = content.split('\n').map((line: string) => {
          if (line.startsWith('## ')) {
             return new Paragraph({ text: line.replace('## ', ''), heading: "Heading2", spacing: { before: 240, after: 120 } });
          } else if (line.trim() === '') {
             return new Paragraph({ text: "", spacing: { before: 120, after: 120 } });
          } else {
             const parts = line.split('**');
             const runs = parts.map((part, i) => new TextRun({ text: part, bold: i % 2 === 1 }));
             return new Paragraph({ children: runs, spacing: { before: 120, after: 120 } });
          }
         });
         
         const doc = new Document({
            sections: [{
              properties: {},
              children: paragraphs
            }]
         });
         const blob = await Packer.toBlob(doc);
         const url = URL.createObjectURL(blob);
         const a = document.createElement('a');
         a.href = url;
         a.download = `${title}.docx`;
         a.click();
         URL.revokeObjectURL(url);
       }
    } catch(e) {
      console.error("Export chat failed:", e);
      alert("Failed to export chat. Check console.");
    }
  };

  const toggleChatHistory = () => {
    const panel = chatHistoryPanelRef.current;
    if (panel) {
      if (isChatHistoryCollapsed) {
        panel.expand();
      } else {
        panel.collapse();
      }
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const renderMessageContent = (content: string) => {
    let displayContent = content;
    let extractedArtifacts: any[] = [];
    let jsonString: string | null = null;
    let replacePattern: string | RegExp = "";

    // 1. Try to find a markdown block containing the JSON
    const blockRegex = /```(?:[a-zA-Z]*)\r?\n([\s\S]*?)\r?\n```/g;
    let match;
    while ((match = blockRegex.exec(content)) !== null) {
      const blockContent = match[1]?.trim() || "";
      if (blockContent.startsWith('{') && blockContent.includes('"artifacts"')) {
        jsonString = blockContent;
        replacePattern = match[0];
        break;
      }
    }

    // 2. If no block found, try raw text search
    if (!jsonString) {
      const startIdx = content.search(/\{\s*"artifacts"/);
      if (startIdx !== -1) {
        const endIdx = content.lastIndexOf('}');
        if (endIdx > startIdx) {
          jsonString = content.substring(startIdx, endIdx + 1);
          replacePattern = jsonString;
        }
      }
    }
    
    if (jsonString) {
      try {
        const parsed = JSON.parse(jsonString);
        if (parsed.artifacts && Array.isArray(parsed.artifacts)) {
          extractedArtifacts = parsed.artifacts;
          displayContent = content.replace(replacePattern, '').trim();
        }
      } catch(e) {}
    }

    return (
      <div className="space-y-3">
        {displayContent && (
          <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
            <ReactMarkdown
              components={{
                a: ({ node, ...props }) => {
                  const isCitation = props.href?.includes('/uploads/') || props.href?.includes('.pdf');
                  return (
                    <a
                      {...props}
                      onClick={(e) => {
                        if (isCitation && props.href) {
                          e.preventDefault();
                          setPdfCitationUrl(props.href);
                        }
                      }}
                      className={isCitation ? "cursor-pointer text-violet-500 hover:text-violet-600 font-medium underline" : "text-violet-500 hover:text-violet-600 underline"}
                    />
                  );
                }
              }}
            >
              {displayContent}
            </ReactMarkdown>
          </div>
        )}
        {extractedArtifacts.length > 0 && (
          <div className="flex flex-col gap-2 mt-3">
            {extractedArtifacts.map((art, idx) => (
              <div 
                key={idx} 
                onClick={() => {
                   setPreviewDoc({
                     type: (art.fileType || 'txt').toUpperCase(),
                     title: art.name,
                     content: art.content,
                     version: art.isNew ? 1 : 'N/A', // Simple fallback, real version is in DB
                     id: art.existingArtifactId || null
                   });
                }}
                className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-card border border-zinc-200 dark:border-zinc-800 hover:border-violet-500/50 cursor-pointer transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{art.name}</div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-500">{art.category} • {art.fileType?.toUpperCase()}</div>
                </div>
                <button className="text-[10px] text-violet-400 hover:text-violet-300 font-medium px-2 py-1 bg-violet-500/10 rounded">
                  Open Preview
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex h-full bg-transparent overflow-hidden relative">
      {/* Citation Modal */}
      {pdfCitationUrl && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-8">
          <div className="bg-zinc-100 dark:bg-[#0f0f13] w-full max-w-5xl h-full max-h-[85vh] rounded-2xl shadow-2xl flex flex-col border border-zinc-200 dark:border-white/10 overflow-hidden relative">
            <div className="flex justify-between items-center p-4 border-b border-zinc-200 dark:border-white/10 bg-white dark:bg-[#16161c]">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-rose-500" />
                Source Document
              </h3>
              <button onClick={() => setPdfCitationUrl(null)} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-zinc-500 transition-colors">
                <PanelLeftClose className="w-5 h-5 rotate-180" />
              </button>
            </div>
            <div className="flex-1 relative">
              <PdfViewer url={pdfCitationUrl} />
            </div>
          </div>
        </div>
      )}
      <PanelGroup direction="horizontal" className="w-full h-full">
        
        {/* Panel 1: Chat History */}
        <Panel 
          ref={chatHistoryPanelRef}
          defaultSize={20} 
          minSize={15} 
          maxSize={30} 
          collapsible={true}
          collapsedSize={0}
          onCollapse={() => setIsChatHistoryCollapsed(true)}
          onExpand={() => setIsChatHistoryCollapsed(false)}
          className={`flex flex-col bg-white dark:bg-[#111113] rounded-3xl border border-zinc-200 dark:border-zinc-800/50 overflow-hidden transition-opacity ${isChatHistoryCollapsed ? 'opacity-0' : 'opacity-100 mr-2'}`}
        >
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800/50 flex justify-between items-center">
            <h2 className="font-semibold text-xs text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
              Chat History
            </h2>
            <button onClick={toggleChatHistory} className="text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:text-white">
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 p-3 overflow-y-auto space-y-4">
            
            {/* Chats Group */}
            <div>
              <button 
                onClick={() => setExpandedGroups(prev => ({ ...prev, chats: !prev.chats }))}
                className="w-full flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:text-zinc-300 transition-colors px-1 mb-2"
              >
                CHATS
                <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800/50 px-1.5 py-0.5 rounded">{chats.length}</span>
              </button>
              {expandedGroups.chats && (
                <div className="space-y-1.5">
                  {chats.map(chat => (
                    <button 
                      key={chat.id}
                      onClick={() => setActiveChatId(chat.id)}
                      className={`w-full text-left p-2.5 text-xs font-medium rounded-lg transition-colors truncate ${
                        activeChatId === chat.id 
                          ? 'text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/20' 
                          : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:bg-zinc-800/50'
                      }`}
                    >
                      {chat.title}
                      <div className={`text-[9px] mt-0.5 font-normal ${activeChatId === chat.id ? 'text-zinc-900 dark:text-white/70' : 'text-zinc-500 dark:text-zinc-500'}`}>
                        {getTimeAgo(chat.updatedAt)}
                      </div>
                    </button>
                  ))}
                  {chats.length === 0 && (
                    <div className="text-center text-zinc-500 dark:text-zinc-500 text-xs py-2">No chats yet</div>
                  )}
                </div>
              )}
            </div>

            {/* Artifacts Group */}
            <div>
              <button 
                onClick={() => setExpandedGroups(prev => ({ ...prev, artifacts: !prev.artifacts }))}
                className="w-full flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:text-zinc-300 transition-colors px-1 mb-2"
              >
                ARTIFACTS
                <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800/50 px-1.5 py-0.5 rounded">{artifacts.length}</span>
              </button>
              {expandedGroups.artifacts && (
                <div className="space-y-1.5">
                  {artifacts.map(art => (
                    <button 
                      key={art.id}
                      onClick={() => {
                         setPreviewDoc({
                           type: art.fileType.toUpperCase(),
                           title: art.name,
                           content: art.content,
                           version: art.version,
                           id: art.id
                         });
                      }}
                      className={`w-full text-left p-2.5 text-xs font-medium rounded-lg transition-colors truncate text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:bg-zinc-800/50 flex items-center gap-2`}
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <div className="flex-1 truncate">
                         {art.name}
                         <div className="text-[9px] mt-0.5 font-normal text-zinc-500 dark:text-zinc-500 flex justify-between">
                           <span>v{art.version} • {art.category}</span>
                           <span>{getTimeAgo(art.updatedAt)}</span>
                         </div>
                      </div>
                    </button>
                  ))}
                  {artifacts.length === 0 && (
                    <div className="text-center text-zinc-500 dark:text-zinc-500 text-xs py-2">No artifacts generated</div>
                  )}
                </div>
              )}
            </div>

          </div>
          <div className="p-3 border-t border-zinc-200 dark:border-zinc-800/50">
            <button 
              onClick={handleNewChat}
              className="w-full py-2 flex items-center justify-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-white hover:bg-zinc-100 dark:bg-zinc-800/50 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Chat
            </button>
          </div>
        </Panel>

        <PanelResizeHandle className={`w-2 flex items-center justify-center group outline-none ${isChatHistoryCollapsed ? 'pointer-events-none opacity-0' : ''}`}>
          <div className="w-1 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 group-hover:bg-violet-500 transition-colors" />
        </PanelResizeHandle>

        {/* Panel 2: Workspace Intelligence (Center) */}
        <Panel 
          defaultSize={isChatHistoryCollapsed ? 65 : 50} 
          minSize={30}
          className="flex flex-col bg-white dark:bg-[#111113] rounded-3xl border border-zinc-200 dark:border-zinc-800/50 overflow-hidden relative shadow-2xl mx-1"
        >
          {/* Header */}
          <div className="h-14 border-b border-zinc-200 dark:border-zinc-800/50 flex items-center px-4 justify-between">
            <div className="flex items-center gap-3">
              {isChatHistoryCollapsed && (
                <button onClick={toggleChatHistory} className="text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:text-white p-1 rounded hover:bg-zinc-200 dark:bg-zinc-800 transition-colors">
                  <PanelLeftOpen className="w-4 h-4" />
                </button>
              )}
              <div className="flex items-center gap-2 bg-zinc-50 dark:bg-[#1A1A1D] px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800/50">
                <Database className="w-4 h-4 text-violet-400" />
                <select 
                  value={selectedKb} 
                  onChange={(e) => setSelectedKb(e.target.value)}
                  disabled={!!activeChatId} // Cannot change KB once chat started
                  className="bg-transparent text-xs font-medium text-zinc-700 dark:text-zinc-300 outline-none disabled:opacity-50 cursor-pointer"
                >
                  <option value="" className="bg-zinc-50 dark:bg-[#1A1A1D] text-zinc-700 dark:text-zinc-300">No Knowledge Base (General Chat)</option>
                  {kbs.map(kb => (
                    <option key={kb.id} value={kb.id} className="bg-zinc-50 dark:bg-[#1A1A1D] text-zinc-700 dark:text-zinc-300">{kb.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {messages.length > 0 && (
                <div className="flex gap-2 mr-2 border-r border-zinc-200 dark:border-zinc-800/50 pr-4">
                  <button onClick={() => handleExportChat('MD')} className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-white transition-colors bg-zinc-100 dark:bg-zinc-800/50 px-2 py-1 rounded">
                    <Download className="w-3 h-3" />
                    MD
                  </button>
                  <button onClick={() => handleExportChat('DOCX')} className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-white transition-colors bg-zinc-100 dark:bg-zinc-800/50 px-2 py-1 rounded">
                    <Download className="w-3 h-3" />
                    DOCX
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2 text-[10px] font-medium text-zinc-600 dark:text-zinc-400 group relative">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                AI Ready 
                <span className="flex items-center justify-center w-3 h-3 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-700 cursor-help">i</span>
                <div className="absolute right-0 top-full mt-2 w-72 max-h-[60vh] overflow-y-auto custom-scrollbar p-3 bg-zinc-50 dark:bg-card border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity text-xs text-zinc-700 dark:text-zinc-300 z-50">
                  <div className="font-semibold text-zinc-900 dark:text-white mb-2 pb-2 border-b border-zinc-200 dark:border-zinc-800">AI Economy</div>
                  <div className="space-y-1">
                    {aiCosts
                      .filter(c => c.credits > 0 && [
                        'workspace_chat', 'knowledge_chat', 'summary_generation', 'quiz_generation', 
                        'document_generation', 'generated_artifact'
                      ].includes(c.operationKey))
                      .map(cost => (
                      <div key={cost.operationKey} className="flex justify-between items-center py-1">
                        <span className="capitalize truncate pr-4 text-zinc-600 dark:text-zinc-400">{cost.displayName || cost.operationKey.replace(/_/g, ' ')}:</span>
                        <span className="font-medium text-violet-400 shrink-0">{cost.credits} Credits</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Messages / Welcome Screen */}
          <div className="flex-1 overflow-y-auto p-6 relative">
            {messages.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                <div className="w-16 h-16 bg-gradient-to-tr from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center mb-5 shadow-2xl shadow-violet-500/20">
                  <LayoutDashboard className="w-8 h-8 text-zinc-900 dark:text-white" />
                </div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">Workspace Intelligence</h1>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto text-center mb-10">Select an optional Knowledge Base to ground your AI. Ask it to explain concepts, write emails, or generate full PDFs and presentations.</p>
                
                <div className="grid grid-cols-3 gap-3 w-full max-w-lg">
                  <button onClick={() => setPrompt("Explain a complex concept simply.")} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:bg-zinc-800/50 transition-colors">
                    <BrainCircuit className="w-5 h-5 text-fuchsia-400" />
                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Explain concept</span>
                  </button>
                  <button onClick={() => setPrompt("Draft a professional email updates to my team.")} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:bg-zinc-800/50 transition-colors">
                    <Mail className="w-5 h-5 text-fuchsia-400" />
                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Draft email</span>
                  </button>
                  <button onClick={() => setPrompt("Generate a PPT presentation based on my KB.")} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:bg-zinc-800/50 transition-colors">
                    <Presentation className="w-5 h-5 text-fuchsia-400" />
                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Generate PPT</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-4xl mx-auto space-y-6 pb-4 px-4">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0 mt-1">
                        <LayoutDashboard className="w-4 h-4 text-zinc-900 dark:text-white" />
                      </div>
                    )}
                    <div className={`p-4 rounded-2xl max-w-[85%] ${msg.role === 'user' ? 'bg-zinc-50 dark:bg-[#1A1A1D] text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800/50' : 'bg-zinc-50 dark:bg-[#1A1A1D] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800/50'}`}>
                        {msg.role === 'assistant' ? renderMessageContent(msg.content) : (
                          <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        )}
                    </div>
                  </div>
                ))}
                {isGenerating && (
                  <div className="flex gap-4 justify-start">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0 mt-1">
                      <LayoutDashboard className="w-4 h-4 text-zinc-900 dark:text-white" />
                    </div>
                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#1A1A1D] border border-zinc-200 dark:border-zinc-800/50 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Box */}
          <div className="p-5 flex flex-col gap-2 relative z-10 bg-white dark:bg-[#111113]">
            {previewDoc && (
              <div className="max-w-4xl mx-auto w-full flex justify-start px-4">
                <div className="flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-400 px-3 py-1.5 rounded-full text-[10px] font-medium transition-all">
                  <FileText className="w-3 h-3" />
                  Editing: {previewDoc.title} (v{previewDoc.version})
                  <button onClick={() => setPreviewDoc(null)} className="ml-1 hover:text-zinc-900 dark:text-white transition-colors">&times;</button>
                </div>
              </div>
            )}
            <div className="max-w-4xl mx-auto w-full px-4">
              <div className="relative flex items-center bg-zinc-50 dark:bg-[#1A1A1D] rounded-2xl border border-zinc-200 dark:border-zinc-800 focus-within:border-violet-500/50 transition-colors shadow-lg">
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ask Workspace AI..."
                  disabled={isGenerating}
                  className="w-full bg-transparent resize-none outline-none py-3 pl-4 pr-12 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-500 dark:text-zinc-500 disabled:opacity-50 min-h-[48px] text-sm"
                  rows={1}
                />
                <button 
                  onClick={handleSend}
                  disabled={!prompt.trim() || isGenerating}
                  className="absolute right-2 p-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg disabled:opacity-50 disabled:hover:bg-violet-600 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="max-w-4xl mx-auto mt-2 text-center flex justify-center items-center gap-2 text-[10px] text-zinc-500 dark:text-zinc-500">
              <Type className="w-3 h-3" />
              <span>Workspace AI grounded on your selected Knowledge Base. <br/><span className="text-rose-500 mt-1 inline-block">Consumes AI Credits based on operations</span></span>
            </div>
          </div>
        </Panel>

        <PanelResizeHandle className="w-2 flex items-center justify-center group outline-none">
          <div className="w-1 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 group-hover:bg-fuchsia-500 transition-colors" />
        </PanelResizeHandle>

        {/* Panel 3: Live Preview Panel */}
        <Panel 
          defaultSize={isChatHistoryCollapsed ? 35 : 30} 
          minSize={25}
          maxSize={50}
          className="flex flex-col bg-white dark:bg-[#111113] rounded-3xl border border-zinc-200 dark:border-zinc-800/50 overflow-hidden ml-1"
        >
          <div className="h-14 border-b border-zinc-200 dark:border-zinc-800/50 flex justify-between items-center px-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              <File className="w-3.5 h-3.5 text-fuchsia-400" />
              Live Preview
            </div>
            {previewDoc && (
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(previewDoc.content);
                  }} 
                  className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-white transition-colors bg-zinc-100 dark:bg-zinc-800/50 px-2 py-1 rounded"
                >
                  <FileText className="w-3 h-3" />
                  Copy Text
                </button>
                {['MD', 'PDF', 'DOCX', 'PPTX', 'XLSX'].map(fmt => (
                  <button key={fmt} onClick={() => handleExport(fmt)} className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-white transition-colors bg-zinc-100 dark:bg-zinc-800/50 px-2 py-1 rounded">
                    <Download className="w-3 h-3" />
                    {fmt}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            {previewDoc ? (
              <div className="bg-zinc-50 dark:bg-[#1A1A1D] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg min-h-full flex flex-col overflow-hidden">
                <div className="border-b border-zinc-200 dark:border-zinc-800 p-2 flex gap-2 items-center bg-zinc-100 dark:bg-card/50">
                  <div className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-fuchsia-500/20 text-fuchsia-400 rounded">
                    {previewDoc.type} EDITOR
                  </div>
                  <div className="flex-1 text-center text-[9px] font-medium text-zinc-500 dark:text-zinc-500">
                    Saved {previewDoc.lastEdited}
                  </div>
                </div>
                <div className="p-5 flex-1 bg-zinc-50 dark:bg-[#1A1A1D] overflow-y-auto">
                  <div ref={previewContentRef} className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{previewDoc.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-14 h-14 bg-zinc-50 dark:bg-[#1A1A1D] rounded-2xl flex items-center justify-center mb-5 border border-zinc-200 dark:border-zinc-800/50 shadow-inner">
                  <FileText className="w-6 h-6 text-zinc-500 dark:text-zinc-500" />
                </div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-2">No Document</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-500 mb-6 max-w-[180px] mx-auto leading-relaxed">Ask AI to generate a PDF, Presentation, or Spreadsheet.</p>
                
                <div className="flex flex-wrap gap-2 justify-center">
                  <span className="text-[9px] font-medium px-2 py-1 rounded bg-zinc-50 dark:bg-[#1A1A1D] border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-500">PDF</span>
                  <span className="text-[9px] font-medium px-2 py-1 rounded bg-zinc-50 dark:bg-[#1A1A1D] border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-500">PPTX</span>
                  <span className="text-[9px] font-medium px-2 py-1 rounded bg-zinc-50 dark:bg-[#1A1A1D] border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-500">XLSX</span>
                  <span className="text-[9px] font-medium px-2 py-1 rounded bg-zinc-50 dark:bg-[#1A1A1D] border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-500">DOCX</span>
                </div>
              </div>
            )}
          </div>
        </Panel>

      </PanelGroup>
      <PremiumUpgradeDialog 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
      />
    </div>
  );
}
