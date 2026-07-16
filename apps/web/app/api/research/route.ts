import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { requireUser } from '../../../lib/auth';
import { safeErrorResponse, ValidationError } from '../../../lib/errors';
import { validateUrl } from '../../../lib/security/url-validator';
import { RateLimitService } from '../../../lib/security/rate-limit';

export async function POST(req: Request) {
  try {
    // 1. Authentication & Rate Limiting
    const { user, error } = await requireUser();
    if (error) return error;

    const rateLimitResponse = await RateLimitService.check(user.id, 'ai');
    if (rateLimitResponse) return rateLimitResponse;

    const { url } = await req.json();

    if (!url) {
      throw new ValidationError('URL is required');
    }

    // 2. SSRF Validation
    const ssrfError = await validateUrl(url);
    if (ssrfError) {
      throw new ValidationError(`Invalid or unsafe URL: ${ssrfError}`);
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new ValidationError(`Failed to fetch URL: ${response.statusText}`);
    }

    const html = await response.text();

    const $ = cheerio.load(html);
    
    // Clean up html for text extraction
    $('script, style, nav, footer, header, iframe, noscript').remove();
    
    const title = $('title').text().trim() || url;
    const description = $('meta[name="description"]').attr('content') || 'No meta description provided by the source.';
    
    const pageText = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 15000); // Get up to 15000 chars

    const apiKey = process.env.GEMINI_API_KEY;
    const apiUrl = undefined;

    if (!apiKey || !apiUrl) {
      // Fallback to basic extraction if no API keys
      const headers: string[] = [];
      $('h1, h2, h3').each((i, el) => {
        const text = $(el).text().trim();
        if (text.length > 5 && !headers.includes(text) && headers.length < 5) headers.push(text);
      });

      const paragraphs: string[] = [];
      $('p').each((i, el) => {
        const text = $(el).text().trim();
        if (text.length > 20 && paragraphs.length < 3) paragraphs.push(text);
      });

      let summary = paragraphs.join(' ').substring(0, 500);
      if (summary.length >= 500) summary += '...';
      if (!summary) summary = "No main content paragraphs detected.";

      return NextResponse.json({
        title,
        description,
        insights: headers.length > 0 ? headers : ["No key insights found"],
        summary,
        risks: ["Data inconsistency in legacy systems", "High resource consumption", "Regulatory compliance challenges"],
        opportunities: ["Automated workflow optimization", "Cross-platform integrations", "Cost-effective scaling"]
      });
    }

    const systemPrompt = `You are an expert research analyst. You are given the text of a webpage. Please extract the following information in strict JSON format:
{
  "summary": "A comprehensive executive summary of the page (3-4 sentences).",
  "insights": ["3 to 5 key insights and trends extracted from the text"],
  "risks": ["2 to 3 identified risks or challenges mentioned or implied"],
  "opportunities": ["2 to 3 opportunities or positive implications"]
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
        system: systemPrompt, messages: [
          { role: "user", content: `URL: ${url}\nTitle: ${title}\nDescription: ${description}\n\nContent:\n${pageText}` }
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
    
    // Strip markdown if the model ignored the prompt
    content = content.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    
    const parsedData = JSON.parse(content);

    return NextResponse.json({
      title,
      description,
      summary: parsedData.summary || "No summary available.",
      insights: parsedData.insights || ["No insights available."],
      risks: parsedData.risks || ["No risks available."],
      opportunities: parsedData.opportunities || ["No opportunities available."]
    });

  } catch (error: unknown) {
    return safeErrorResponse(error, 'Research Route');
  }
}
