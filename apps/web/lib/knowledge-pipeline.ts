import Tesseract from 'tesseract.js';
import mammoth from 'mammoth';
import * as xlsx from 'xlsx';
import { chunkText } from './embeddings';
import { generateWithFallbacks } from '@repo/ai';

export async function extractTextFromBuffer(buffer: Buffer, mimeType: string, filename: string): Promise<string> {
  const fileExtension = filename.split('.').pop()?.toLowerCase() || '';
  let extractedText = '';

  if (mimeType.startsWith('image/')) {
    try {
      const { data } = await Tesseract.recognize(buffer, 'eng');
      extractedText = data.text;
    } catch (err) {
      console.error("OCR failed:", err);
    }
  } else if (mimeType === 'application/pdf' || fileExtension === 'pdf') {
    try {
      const PDFParser = require("pdf2json");
      extractedText = await new Promise((resolve, reject) => {
        const pdfParser = new PDFParser(null, 1);
        pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
        pdfParser.on("pdfParser_dataReady", () => resolve(pdfParser.getRawTextContent()));
        pdfParser.parseBuffer(buffer);
      });
    } catch (err) {
      console.error("PDF parse failed:", err);
    }
  } else if (fileExtension === 'docx') {
    try {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } catch (err) {
      console.error("DOCX parse failed:", err);
    }
  } else if (['xlsx', 'xls', 'csv'].includes(fileExtension)) {
    try {
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      const sheetTexts = workbook.SheetNames.map(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        return worksheet ? xlsx.utils.sheet_to_csv(worksheet) : '';
      });
      extractedText = sheetTexts.join('\n\n---\n\n');
    } catch (err) {
      console.error("XLSX parse failed:", err);
    }
  } else if (['pptx', 'ppt', 'odp', 'ods', 'odt'].includes(fileExtension)) {
    try {
      const officeParser = require('officeparser');
      extractedText = await officeParser.parseOfficeAsync(buffer);
    } catch (err) {
      console.error("OfficeParser failed:", err);
    }
  } else {
    const rawText = buffer.toString('utf-8');
    extractedText = rawText.replace(/[^\x20-\x7E\n\r]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  return extractedText;
}

export function cleanExtractedText(extractedText: string): string {
  return extractedText
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^(Page \d+|Confidential)\s*$/gmi, "")
    .trim();
}

export async function enhanceTextWithAI(cleanedText: string, apiKey: string, apiUrl?: string) {
  let enhancedData = {
    summary: "",
    topics: [] as string[],
    keywords: [] as string[],
    classification: "Unclassified",
    knowledgeContent: cleanedText,
    embeddingContent: cleanedText
  };

  try {
    const knowledgePrompt = `You are an AI Document Synthesizer. Take the following raw extracted text and convert it into a structured, human-readable Knowledge Document. Provide an Executive Summary, Key Concepts, Best Practices, and Recommendations. Provide your output strictly as a JSON object matching this schema:
{
  "summary": "A 2-3 sentence executive summary",
  "topics": ["Topic 1", "Topic 2"],
  "keywords": ["keyword1", "keyword2"],
  "classification": "Document Type (e.g. Research Paper, API Docs, General)",
  "knowledgeContent": "# Markdown Formatted Knowledge Document\\n\\n..."
}`;
    const knowledgeRes = await generateWithFallbacks({
      messages: [
        { role: "system", content: knowledgePrompt },
        { role: "user", content: cleanedText.substring(0, 15000) }
      ],
      agentRole: "reasoning"
    }, apiKey, apiUrl as string);

    try {
      const jsonMatch = knowledgeRes.content.match(/```json\n([\s\S]*?)\n```/) || knowledgeRes.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1] ?? jsonMatch[0] ?? '{}');
        enhancedData.summary = parsed.summary || "";
        enhancedData.topics = parsed.topics || [];
        enhancedData.keywords = parsed.keywords || [];
        enhancedData.classification = parsed.classification || "Unclassified";
        enhancedData.knowledgeContent = parsed.knowledgeContent || cleanedText;
      }
    } catch (e) {
      console.error("Failed to parse Knowledge AI JSON", e);
    }

    const embeddingPrompt = `You are an AI Document Structurer. Your task is to take the following raw text and convert it into highly structured, discrete Markdown blocks optimized purely for vector chunking and semantic search retrieval. Focus on extracting specific implementation details, APIs, code snippets, and exact terminology. Output ONLY valid markdown. Do not wrap in JSON.`;
    
    const embeddingRes = await generateWithFallbacks({
      messages: [
        { role: "system", content: embeddingPrompt },
        { role: "user", content: cleanedText.substring(0, 15000) }
      ],
      agentRole: "formatting"
    }, apiKey, apiUrl as string);

    if (embeddingRes.content && embeddingRes.content.length > 50) {
      enhancedData.embeddingContent = embeddingRes.content.replace(/```markdown\n?/g, '').replace(/```\n?/g, '').trim();
    }

  } catch (e) {
    console.error("AI Enhancement failed:", e);
  }

  return enhancedData;
}

export function smartChunkMarkdown(markdown: string): string[] {
  const chunks: string[] = [];
  const lines = markdown.split('\n');
  let currentChunk = '';

  for (const line of lines) {
    if (line.match(/^#{1,3}\s/)) {
      if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = line + '\n';
    } else {
      currentChunk += line + '\n';
    }
  }
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  const finalChunks: string[] = [];
  for (const c of chunks) {
    if (c.length > 2000) {
       finalChunks.push(...chunkText(c, 1000, 200));
    } else {
       finalChunks.push(c);
    }
  }

  return finalChunks.length > 0 ? finalChunks : [markdown];
}

export function extractRelationships(content: string, type: 'flutter' | 'dotnet' | 'database' | 'openapi' | 'unknown' = 'unknown'): any {
  const relationships: { related: string[] } = { related: [] };
  const relatedSet = new Set<string>();

  if (type === 'flutter') {
    // Basic extraction for Flutter imports
    const importRegex = /import\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      if (match[1]) {
        const parts = match[1].split('/');
        const lastPart = parts[parts.length - 1];
        if (lastPart) {
          const filename = lastPart.replace('.dart', '');
          relatedSet.add(filename);
        }
      }
    }
    // Very basic provider/service regex
    const providerRegex = /([A-Z][a-zA-Z0-9]+)(?:Provider|Service|Controller)/g;
    while ((match = providerRegex.exec(content)) !== null) {
      relatedSet.add(match[0]);
    }
  } else if (type === 'dotnet') {
    // Using statements
    const usingRegex = /using\s+([a-zA-Z0-9_.]+);/g;
    let match;
    while ((match = usingRegex.exec(content)) !== null) {
      if (match[1]) relatedSet.add(match[1]);
    }
    // Interface/Service injection in constructor
    const injectionRegex = /(?:public|private|protected)\s+readonly\s+I([A-Z][a-zA-Z0-9]+Service|[A-Z][a-zA-Z0-9]+Repository)/g;
    while ((match = injectionRegex.exec(content)) !== null) {
      if (match[1]) relatedSet.add(match[1]);
    }
  } else if (type === 'openapi') {
    // Match refs
    const refRegex = /"\$ref":\s*"#\/components\/schemas\/([^"]+)"/g;
    let match;
    while ((match = refRegex.exec(content)) !== null) {
      if (match[1]) relatedSet.add(match[1]);
    }
  }

  relationships.related = Array.from(relatedSet);
  return relationships;
}
