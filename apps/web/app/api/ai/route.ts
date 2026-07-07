import { NextResponse } from 'next/server';
import { generateWithFallbacks, TaskCategory } from '@repo/ai';
import { requireUser } from '../../../lib/auth';
import { RateLimitService } from '../../../lib/security/rate-limit';

export async function POST(req: Request) {
  try {
    const { user, error: authError } = await requireUser();
    if (authError) return authError;

    const rateLimitResponse = await RateLimitService.check(user.id, 'ai');
    if (rateLimitResponse) return rateLimitResponse;

    const { markdown, prompt, type } = await req.json();

    if (!markdown) {
      return NextResponse.json({ error: "Markdown content is required" }, { status: 400 });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      if (type === "clean_and_analyze") {
        // Fallback basic regex cleaning to simulate AI optimization
        const basicClean = markdown
          .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Remove markdown links
          .replace(/^(#|\*|-|>)\s?/gm, "") // Remove common markdown symbols
          .replace(/\n{3,}/g, "\n\n") // Remove excessive newlines
          .trim();
        
        return NextResponse.json({ 
          success: true, 
          data: `*⚠️ AI API Key not configured. Showing basic regex-cleaned fallback.*\n\n---\n\n${basicClean.substring(0, 3000)}...\n\n[Content Truncated]` 
        });
      } else {
        return NextResponse.json({ success: true, data: "I am a simulated AI. Set DEEPSEEK_API_KEY to enable real AI responses." });
      }
    }

    let systemPrompt = "";
    if (type === "summary") {
      systemPrompt = "You are a highly intelligent AI assistant. Your task is to read the following webpage content (provided in Markdown) and generate a concise, structured summary. Extract the key takeaways, main arguments, and any important data points.";
    } else if (type === "chat") {
      systemPrompt = `You are a helpful assistant. You are chatting with the user about a specific webpage. The webpage content is as follows:\n\n---\n${markdown}\n---\nAnswer the user's prompt based on this content.`;
    } else if (type === "professional_pdf") {
      systemPrompt = "You are an expert document editor. Convert the following webpage content into a highly professional, well-structured Markdown document suitable for a business PDF. Remove all ads, navigation links, and noise. Include a clear Title (H1), an Executive Summary, structured sections with H2/H3 headings, and bullet points where appropriate. Output strictly valid Markdown.";
    } else if (type === "clean_and_analyze") {
      systemPrompt = "You are an expert data cleaner. The user will provide raw markdown scraped from a website. Your job is to extract ONLY the meaningful, core content. REMOVE all navigation menus, header links, footer text, ad placeholders, and raw markdown image links. Format the output as clean, readable Markdown that preserves the true article/content. Do not add conversational filler. Just output the cleaned document.";
    }

    const result = await generateWithFallbacks({
      system: systemPrompt,
      messages: [
        { role: "user", content: type === "summary" ? markdown : prompt }
      ],
      taskCategory: type === "summary" ? TaskCategory.STRUCTURED : TaskCategory.REASONING,
    }, apiKey, process.env.DEEPSEEK_API_URL);

    return NextResponse.json({ success: true, data: result.content });
  } catch (error: any) {
    console.error("AI Proxy Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
