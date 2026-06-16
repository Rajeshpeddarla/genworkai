"use client";

import { Document, Packer, Paragraph, HeadingLevel } from "docx";
import { jsPDF } from "jspdf";

import { useState } from "react";
import { 
  Search, 
  Globe,
  Link as LinkIcon, 
  UploadCloud, 
  FileText, 
  PlaySquare, 
  Camera, 
  Code2, 
  Image as ImageIcon,
  ArrowRight,
  FileBarChart,
  Download,
  Share2,
  ServerCog,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Building2,
  Users
} from "lucide-react";

export default function ResearchStudioPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [url, setUrl] = useState("");
  const [results, setResults] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setIsAnalyzing(true);
    setErrorMsg("");
    
    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to analyze');
      setResults(data);
      setShowResult(true);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setErrorMsg("");
    setUrl(file.name);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      let data;
      try {
        data = await res.json();
      } catch (e) {
        throw new Error("Server returned an invalid response. The file might be too large or the server crashed.");
      }
      
      if (!res.ok) throw new Error(data.error || 'Failed to analyze document');
      
      setResults(data);
      setShowResult(true);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsAnalyzing(false);
      // Reset input value to allow re-uploading the same file
      e.target.value = '';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <div className="p-2 bg-fuchsia-500/10 text-fuchsia-400 rounded-lg border border-fuchsia-500/20">
              <Search className="w-6 h-6" />
            </div>
            Research Studio
          </h1>
          <p className="text-zinc-400 mt-1">Transform links, videos, and documents into comprehensive intelligence reports.</p>
        </div>
        
        {showResult && (
          <div className="flex items-center gap-2">
            <button onClick={async () => {
              try {
                const doc = new Document({
                  sections: [{
                    properties: {},
                    children: [
                      new Paragraph({ text: results?.title || "Analysis Report", heading: HeadingLevel.HEADING_1 }),
                      new Paragraph({ text: `Source: ${url}`, heading: HeadingLevel.HEADING_3 }),
                      new Paragraph({ text: "Executive Summary", heading: HeadingLevel.HEADING_2 }),
                      new Paragraph({ text: results?.summary || "" }),
                      new Paragraph({ text: "Key Insights & Trends", heading: HeadingLevel.HEADING_2 }),
                      ...(results?.insights || []).map((insight: string, i: number) => new Paragraph({ text: `Key Header ${i + 1}: ${insight}`, bullet: { level: 0 } })),
                      new Paragraph({ text: "Identified Risks", heading: HeadingLevel.HEADING_2 }),
                      ...(results?.risks || []).map((risk: string) => new Paragraph({ text: risk, bullet: { level: 0 } })),
                      new Paragraph({ text: "Opportunities", heading: HeadingLevel.HEADING_2 }),
                      ...(results?.opportunities || []).map((opp: string) => new Paragraph({ text: opp, bullet: { level: 0 } })),
                    ]
                  }]
                });
                const blob = await Packer.toBlob(doc);
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = "Research_Report.docx";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              } catch (e) {
                console.error("Failed to generate DOCX", e);
                alert("Failed to generate DOCX.");
              }
            }} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 border border-blue-500 text-sm font-medium hover:bg-blue-500 transition-colors text-white shadow-lg">
              <Download className="w-4 h-4" /> Download DOCX
            </button>
            <button onClick={() => {
              try {
                const doc = new jsPDF();
                const margin = 15;
                let y = 20;
                
                const addText = (text: string, size: number, isBold: boolean = false) => {
                    doc.setFontSize(size);
                    doc.setFont("helvetica", isBold ? "bold" : "normal");
                    const lines = doc.splitTextToSize(text, 180);
                    if (y + (lines.length * 7) > 280) {
                        doc.addPage();
                        y = 20;
                    }
                    doc.text(lines, margin, y);
                    y += (lines.length * 7) + 5;
                };
                
                addText(results?.title || "Analysis Report", 18, true);
                addText(`Source: ${url}`, 10, false);
                y += 5;
                
                addText("Executive Summary", 14, true);
                addText(results?.summary || "", 12, false);
                
                addText("Key Insights & Trends", 14, true);
                (results?.insights || []).forEach((insight: string, i: number) => {
                    addText(`• Key Header ${i + 1}: ${insight}`, 12, false);
                });
                
                addText("Identified Risks", 14, true);
                (results?.risks || []).forEach((risk: string) => {
                    addText(`• ${risk}`, 12, false);
                });
                
                addText("Opportunities", 14, true);
                (results?.opportunities || []).forEach((opp: string) => {
                    addText(`• ${opp}`, 12, false);
                });
                
                doc.save("Research_Report.pdf");
              } catch (e) {
                console.error("Failed to generate PDF", e);
                alert("Failed to generate PDF.");
              }
            }} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-fuchsia-600 border border-fuchsia-500 text-sm font-medium hover:bg-fuchsia-500 transition-colors text-white shadow-lg">
              <Download className="w-4 h-4" /> Download PDF
            </button>
          </div>
        )}
      </div>

      {!showResult ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
          {/* Main Input Area */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <h2 className="text-xl font-bold text-white mb-6 relative z-10">Generate New Report</h2>
              
              <form onSubmit={handleAnalyze} className="relative z-10 space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <LinkIcon className="h-5 w-5 text-zinc-500" />
                  </div>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="block w-full rounded-xl border-0 py-4 pl-12 pr-32 bg-black/40 text-white ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-fuchsia-500 sm:text-base sm:leading-6 placeholder:text-zinc-500 transition-shadow"
                    placeholder="Paste Website URL or GitHub Repo..."
                  />
                  <div className="absolute inset-y-1 right-1 flex items-center">
                    <button
                      type="submit"
                      disabled={isAnalyzing || !url}
                      className="flex items-center gap-2 rounded-lg bg-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-fuchsia-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isAnalyzing ? (
                        <>Analyzing... <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /></>
                      ) : (
                        <>Analyze <ArrowRight className="w-4 h-4" /></>
                      )}
                    </button>
                  </div>
                </div>
                {errorMsg && <div className="text-red-400 text-sm mt-2">{errorMsg}</div>}

                <div className="flex items-center gap-4 text-sm text-zinc-500">
                  <span className="flex-1 h-px bg-white/10"></span>
                  <span>OR</span>
                  <span className="flex-1 h-px bg-white/10"></span>
                </div>

                <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:bg-white/5 transition-colors group/upload relative overflow-hidden">
                  <input 
                    type="file" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50" 
                    accept=".txt,.pdf,.docx,.doc,image/*" 
                    onChange={handleFileUpload} 
                    title="Upload a file"
                  />
                  <UploadCloud className="w-10 h-10 mx-auto text-zinc-500 group-hover/upload:text-fuchsia-400 transition-colors mb-3" />
                  <div className="text-sm font-medium text-white mb-1">Click to upload or drag and drop</div>
                  <div className="text-xs text-zinc-500">PDF, DOCX, Images, or Screenshots</div>
                </div>
              </form>
            </div>
          </div>

          {/* Supported Sources */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Supported Sources</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: "Websites", icon: Globe, color: "text-blue-400", bg: "bg-blue-400/10" },
                { name: "Documents", icon: FileText, color: "text-emerald-400", bg: "bg-emerald-400/10" },
                { name: "GitHub", icon: Code2, color: "text-zinc-300", bg: "bg-zinc-400/10" },
                { name: "Images", icon: ImageIcon, color: "text-violet-400", bg: "bg-violet-400/10" },
              ].map((source) => (
                <div key={source.name} className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-zinc-900/30">
                  <div className={`p-2 rounded-lg ${source.bg} ${source.color}`}>
                    <source.icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-zinc-300">{source.name}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 p-5 rounded-xl border border-fuchsia-500/20 bg-gradient-to-b from-fuchsia-500/10 to-transparent">
              <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <FileBarChart className="w-4 h-4 text-fuchsia-400" />
                Comprehensive Output
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                GenWorkAI automatically generates executive summaries, extracts entities, analyzes competitors, and builds a reference matrix from your provided context.
              </p>
              <div className="text-[10px] text-fuchsia-300 font-medium bg-fuchsia-500/20 inline-block px-2 py-1 rounded">Takes ~45 seconds</div>
            </div>
          </div>
        </div>
      ) : (
        /* Report Result View */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {/* Main Report Column */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-fuchsia-500 to-violet-500 flex items-center justify-center">
                  <FileBarChart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white max-w-xl truncate" title={results?.title || "Analysis Report"}>{results?.title || "Analysis Report"}</h2>
                  <div className="text-sm text-zinc-400 flex items-center gap-2 mt-1 truncate max-w-xl">
                    <LinkIcon className="w-3 h-3 shrink-0" /> Source: {url}
                  </div>
                </div>
              </div>

              <div className="prose prose-invert max-w-none">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Executive Summary
                </h3>
                <p className="text-zinc-300 leading-relaxed">
                  {results?.summary || "No summary available."}
                </p>

                <h3 className="text-xl font-semibold text-white mt-8 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" /> Key Insights & Trends
                </h3>
                <ul className="text-zinc-300">
                  {results?.insights?.length > 0 ? results.insights.map((insight: string, i: number) => (
                    <li key={i}><strong>Key Header {i+1}:</strong> {insight}</li>
                  )) : (
                    <li>No key headers extracted.</li>
                  )}
                </ul>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 not-prose">
                  <div className="p-5 rounded-xl border border-amber-500/20 bg-amber-500/5">
                    <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4" /> Identified Risks
                    </h4>
                    <ul className="text-sm text-zinc-300 space-y-2 list-disc pl-4">
                      {results?.risks?.length > 0 ? results.risks.map((risk: string, i: number) => (
                        <li key={i}>{risk}</li>
                      )) : (
                        <li>No specific risks identified.</li>
                      )}
                    </ul>
                  </div>
                  
                  <div className="p-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                    <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4" /> Opportunities
                    </h4>
                    <ul className="text-sm text-zinc-300 space-y-2 list-disc pl-4">
                      {results?.opportunities?.length > 0 ? results.opportunities.map((opp: string, i: number) => (
                        <li key={i}>{opp}</li>
                      )) : (
                        <li>No specific opportunities identified.</li>
                      )}
                    </ul>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Sidebar Data Column */}
          <div className="space-y-6">
            

            <button 
              onClick={() => {
                setShowResult(false);
                setUrl("");
              }}
              className="w-full py-3 rounded-xl border border-white/10 text-sm font-medium text-white hover:bg-white/5 transition-colors"
            >
              Start New Research
            </button>

          </div>
        </div>
      )}
    </div>
  );
}