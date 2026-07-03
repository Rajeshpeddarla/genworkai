"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, ChevronDown } from 'lucide-react';
import { FlashcardRenderer } from './renderers/FlashcardRenderer';
import { StudyNotesRenderer } from './renderers/StudyNotesRenderer';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function UniversalOutputViewer({ outputId, onBack }: { outputId: number, onBack: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    async function fetchOutput() {
      try {
        const res = await fetch(`/api/generation/outputs/${outputId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchOutput();
  }, [outputId]);

  if (loading) return <div className="p-12 text-center text-gray-500 animate-pulse">Loading Output...</div>;
  if (error) return <div className="p-12 text-center text-red-500">{error}</div>;
  if (!data) return null;

  const activeVersion = data.versions[0];

  let parsedContent = null;
  try {
    parsedContent = JSON.parse(activeVersion.content);
  } catch (e) {
    parsedContent = activeVersion.content;
  }

  const renderContent = () => {
    if (activeVersion.format === 'flashcards_v1') {
      return <FlashcardRenderer data={parsedContent} />;
    }
    if (activeVersion.format === 'study_notes_v1') {
      return <StudyNotesRenderer data={parsedContent} />;
    }
    // Fallback renderer for markdown or unknown JSON
    if (typeof parsedContent === 'object') {
      return (
        <pre className="bg-[#111] p-6 rounded-xl border border-gray-800 text-green-400 overflow-auto">
          {JSON.stringify(parsedContent, null, 2)}
        </pre>
      );
    }
    return (
      <div className="prose prose-invert prose-indigo max-w-none text-gray-300">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{typeof parsedContent === 'string' ? parsedContent : JSON.stringify(parsedContent)}</ReactMarkdown>
      </div>
    );
  };

  const handleExport = (format: string) => {
    const contentToExport = typeof parsedContent === 'object' ? JSON.stringify(parsedContent, null, 2) : activeVersion.content;
    const title = data.output.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    if (format === 'pdf') {
      setShowExportMenu(false);
      
      const printContent = document.getElementById('printable-content');
      if (!printContent) return;
  
      // Create a hidden iframe
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
  
      const iframeDoc = iframe.contentWindow?.document;
      if (!iframeDoc) return;
  
      // Copy all style sheets from the main document to the iframe
      const styleSheets = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'));
      let stylesHtml = '';
      styleSheets.forEach((styleNode) => {
        stylesHtml += styleNode.outerHTML;
      });
  
      // Custom print styles for professional look
      const customStyle = `
        <style>
          @page { size: auto; margin: 20mm; }
          body { 
            background-color: white !important; 
            color: black !important;
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
          }
          /* Force prose elements to black */
          .prose, .prose-invert { color: black !important; max-width: none !important; }
          .prose * , .prose-invert * { color: black !important; border-color: #d1d5db !important; }
          
          /* Headers and bold text */
          h1, h2, h3, h4, h5, h6 { 
            color: black !important; 
            font-weight: 700 !important; 
            margin-top: 1.5em !important; 
            margin-bottom: 0.5em !important;
          }
          strong, b { color: black !important; font-weight: bold !important; }
          
          /* Remove custom backgrounds from pre/code in print and FORCE TEXT WRAP */
          pre { 
            background-color: #f3f4f6 !important; 
            color: #1f2937 !important; 
            border: 1px solid #e5e7eb !important;
            white-space: pre-wrap !important;
            word-wrap: break-word !important;
            word-break: break-all !important;
            overflow-wrap: anywhere !important;
            padding: 1rem !important;
            border-radius: 0.5rem !important;
          }
          code {
            white-space: pre-wrap !important;
            word-wrap: break-word !important;
            word-break: break-word !important;
            background-color: #f3f4f6 !important;
            padding: 0.125rem 0.25rem !important;
            border-radius: 0.25rem !important;
          }
          
          /* Tables with professional borders */
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin: 1.5em 0 !important;
          }
          th, td {
            border: 1px solid #d1d5db !important;
            padding: 0.75rem !important;
            text-align: left !important;
          }
          th {
            background-color: #f9fafb !important;
            font-weight: 600 !important;
          }
          
          /* Lists */
          ul, ol { padding-left: 1.5rem !important; margin-bottom: 1rem !important; }
          li { margin-bottom: 0.25rem !important; }
          
          /* Specific fixes for Flashcard / Study Notes */
          .bg-\\[\\#111\\], .bg-\\[\\#1a1a1a\\] { background-color: white !important; border-color: #e5e7eb !important; }
        </style>
      `;
  
      // Write content to iframe
      iframeDoc.open();
      iframeDoc.write(`
        <html>
          <head>
            <title>${data.output.title}</title>
            ${stylesHtml}
            ${customStyle}
          </head>
          <body class="bg-white">
            <div style="padding: 2rem; max-width: 800px; margin: 0 auto;">
              <h1 style="font-size: 2.5rem; font-weight: bold; margin-bottom: 2rem; text-align: center; color: black; border-bottom: 2px solid #eaeaea; padding-bottom: 1rem; text-transform: capitalize;">
                ${data.output.title}
              </h1>
              ${printContent.innerHTML}
            </div>
          </body>
        </html>
      `);
      iframeDoc.close();
  
      // Wait for iframe resources to load
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        
        // Cleanup
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);
      return;
    }
    
    let mimeType = 'text/plain';
    if (format === 'docx') {
      mimeType = 'application/msword';
    } else if (format === 'md') {
      mimeType = 'text/markdown';
    }

    const blob = new Blob([contentToExport], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] print:bg-white print:h-auto">
      {/* Header Bar */}
      <div className="border-b border-gray-800 bg-[#111] p-4 flex items-center justify-between shrink-0 print:hidden">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-white">{data.output.title}</h2>
            <div className="text-xs text-gray-500 flex gap-2">
              <span>{data.output.module}</span> • <span>{data.output.template}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" /> Export <ChevronDown className="w-3 h-3" />
            </button>
            {showExportMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowExportMenu(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-48 bg-[#111] border border-gray-800 rounded-lg shadow-xl overflow-hidden z-50">
                  <button 
                    onClick={() => handleExport('pdf')} 
                    className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
                  >
                    PDF Document (.pdf)
                  </button>
                  <button 
                    onClick={() => handleExport('docx')} 
                    className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
                  >
                    Word Document (.docx)
                  </button>
                  <button 
                    onClick={() => handleExport('txt')} 
                    className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
                  >
                    Text File (.txt)
                  </button>
                  <button 
                    onClick={() => handleExport('md')} 
                    className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
                  >
                    Markdown (.md)
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden print:overflow-visible">
        {/* Render Area */}
        <div id="printable-content" className="flex-1 overflow-y-auto p-8 relative print:p-0 print:overflow-visible">
          {renderContent()}
        </div>


      </div>
    </div>
  );
}
