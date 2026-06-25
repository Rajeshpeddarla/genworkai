import { NextResponse } from 'next/server';
import Tesseract from 'tesseract.js'; // Cache buster
import mammoth from 'mammoth';
import * as xlsx from 'xlsx';

import { db } from '../../../db';
import { documents, documentChunks, knowledgeBases } from '../../../db/schema';
import { chunkText, generateEmbedding } from '../../../lib/embeddings';
import { validateUpload as validateUploadBuffer } from '../../../lib/security/file-upload';
import { safeErrorResponse, ValidationError } from '../../../lib/errors';
import { requireUser } from '../../../lib/auth';
import { validateUpload } from '../../../lib/security/uploads';
import { RateLimitService } from '../../../lib/security/rate-limit';

export async function POST(req: Request) {
  try {
    const { user, error: authError } = await requireUser();
    if (authError) return authError;

    const rateLimitResponse = await RateLimitService.check(user.id, 'upload');
    if (rateLimitResponse) return rateLimitResponse;

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'File is required' }, { status: 400 });

    const { valid, error, status } = validateUpload(file, 'document');
    if (!valid) {
      return NextResponse.json({ error }, { status: status || 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // File Security Validation
    const validation = validateUploadBuffer({ name: file.name, type: file.type, size: file.size }, buffer);
    if (!validation.valid) {
      throw new ValidationError(validation.error || 'Invalid file');
    }

    const mimeType = file.type;
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    let extractedText: any = '';

    // Extract text based on file type
    if (mimeType.startsWith('image/')) {
      try {
        const { data } = await Tesseract.recognize(buffer, 'eng');
        extractedText = data.text;
      } catch (err) {
        console.error("OCR failed:", err);
        extractedText = "Failed to extract text from image.";
      }
    } else if (mimeType === 'application/pdf' || fileExtension === 'pdf') {
      try {
        const PDFParser = require("pdf2json");
        extractedText = await new Promise((resolve, reject) => {
          const pdfParser = new PDFParser(null, 1); // 1 flag = raw text only
          pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
          pdfParser.on("pdfParser_dataReady", () => {
            resolve(pdfParser.getRawTextContent());
          });
          pdfParser.parseBuffer(buffer);
        });
      } catch (err) {
        console.error("PDF parse failed:", err);
        extractedText = "Failed to extract text from PDF.";
      }
    } else if (fileExtension === 'docx') {
      try {
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value;
      } catch (err) {
        console.error("Mammoth DOCX parse failed:", err);
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
        // @ts-ignore
        extractedText = await officeParser.parseOfficeAsync(buffer);
      } catch (err) {
        console.error("OfficeParser failed:", err);
      }
    } else {
      // For plain TXT, MD, etc., try to extract raw text as string
      const rawText = buffer.toString('utf-8');
      extractedText = rawText.replace(/[^\x20-\x7E\n\r]/g, ' ').replace(/\s+/g, ' ').trim();
    }

    if (!extractedText || extractedText.length < 10) {
      extractedText = "Not enough text could be extracted from the uploaded document to form a meaningful analysis.";
    }

    // In GenWorkAI V2, Research Studio is ephemeral ("work and forget"). 
    // Persistent embeddings are handled separately in the Knowledge Base module.

    const pageText = extractedText.substring(0, 15000); // Send up to 15000 chars to LLM

    const apiKey = process.env.DEEPSEEK_API_KEY;
    const apiUrl = process.env.DEEPSEEK_API_URL;

    if (!apiKey || !apiUrl) {
      return NextResponse.json({
        title: file.name,
        description: `Uploaded document: ${file.name}`,
        insights: ["Please configure DEEPSEEK API for full insights."],
        summary: "API keys are missing. Here is the first 500 chars of extracted text: " + pageText.substring(0, 500),
        risks: [],
        opportunities: []
      });
    }

    const systemPrompt = `You are an expert research analyst. You are given the text extracted from a document. Please extract the following information in strict JSON format:
{
  "summary": "A highly detailed, multi-paragraph executive summary of the document. Explain all major arguments, sections, and findings in extreme depth.",
  "insights": ["8 to 12 in-depth key insights, trends, and specific data points extracted from the text"],
  "risks": ["4 to 6 identified risks, flaws, or challenges mentioned or implied"],
  "opportunities": ["4 to 6 opportunities, positive implications, or future work"]
}
Return only valid JSON. Do not include markdown formatting like \`\`\`json.`;

    const llmRes = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-v4-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Filename: ${file.name}\n\nContent:\n${pageText}` }
        ],
        response_format: { type: "json_object" }
      })
    });

    if (!llmRes.ok) {
       console.error("LLM API Error:", await llmRes.text());
       throw new Error(`LLM API Error: ${llmRes.statusText}`);
    }

    const llmData = await llmRes.json();
    let content = llmData.choices[0].message.content;
    content = content.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    
    const parsedData = JSON.parse(content);

    return NextResponse.json({
      title: file.name,
      description: `Analysis of uploaded document: ${file.name}`,
      summary: parsedData.summary || "No summary available.",
      insights: parsedData.insights || ["No insights available."],
      risks: parsedData.risks || ["No risks available."],
      opportunities: parsedData.opportunities || ["No opportunities available."]
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return safeErrorResponse(error, 'File Upload Route');
  }
}

