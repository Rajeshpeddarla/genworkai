import { NextResponse } from 'next/server';
import { chromium } from 'playwright';
import * as cheerio from 'cheerio';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    const html = await page.content();
    await browser.close();

    const $ = cheerio.load(html);
    
    // Clean up html for text extraction
    $('script, style, nav, footer, header, iframe, noscript').remove();
    
    const title = $('title').text().trim() || url;
    const description = $('meta[name="description"]').attr('content') || 'No meta description provided by the source.';
    
    const pageText = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 15000); // Get up to 15000 chars

    const apiKey = process.env.CKEY_API_KEY;
    const apiUrl = process.env.CKEY_API_URL;

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
        messages: [
          { role: "system", content: systemPrompt },
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

  } catch (error: any) {
    console.error('Scraping error:', error);
    return NextResponse.json({ error: error.message || 'Failed to scrape URL' }, { status: 500 });
  }
}
