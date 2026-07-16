"use client";

import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface BoundingBox {
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface PdfViewerProps {
  url: string;
  citations?: BoundingBox[];
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ url, citations = [] }) => {
  const [numPages, setNumPages] = useState<number | null>(null);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  // Calculate overlay styles based on relative bounding box dimensions
  const renderOverlays = (pageIndex: number) => {
    return citations
      .filter((cit) => cit.page === pageIndex)
      .map((cit, idx) => (
        <div
          key={idx}
          className="absolute bg-yellow-300/40 border-2 border-yellow-500 rounded-sm pointer-events-none mix-blend-multiply z-10"
          style={{
            left: `${cit.x}%`,
            top: `${cit.y}%`,
            width: `${cit.w}%`,
            height: `${cit.h}%`,
          }}
        />
      ));
  };

  return (
    <div className="w-full h-full flex flex-col items-center bg-gray-100 overflow-y-auto p-4 rounded-lg">
      <div className="shadow-xl bg-white w-full max-w-[800px]">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          className="flex flex-col items-center"
          loading={
            <div className="w-full py-20 flex items-center justify-center text-gray-400">
              Loading PDF...
            </div>
          }
        >
          {numPages && Array.from(new Array(numPages), (el, index) => (
            <div key={`page_${index + 1}`} className="relative mb-4 border-b border-gray-200 last:border-b-0 pb-4 last:pb-0">
              <Page 
                pageNumber={index + 1} 
                width={800} // Fixed width for predictable bounding box scaling
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
              {/* Highlight Overlays placed on top of the rendered page */}
              {renderOverlays(index + 1)}
            </div>
          ))}
        </Document>
      </div>
    </div>
  );
};
