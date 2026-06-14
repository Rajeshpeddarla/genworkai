import dns from "node:dns";

// Fix Windows Node.js IPv6-first DNS resolution causing external API failures.
try {
  dns.setDefaultResultOrder("ipv4first");
} catch (e) {
  // Ignored in browser context
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatCompletionOptions {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  responseFormatJson?: boolean;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  agentRole?: 'reasoning' | 'fast' | 'formatting'; // Smart routing selector
  onLog?: (msg: string) => void;
  timeoutMs?: number;
}

export interface ChatCompletionResult {
  content: string;
  model: string;
  provider: "ckey";
}

// ─── Smart Model Routing ─────────────────────────────────────────

const MODEL_ROUTING: Record<string, string> = {
  reasoning:  "deepseek-v4-flash",
  fast:       "deepseek-v4-flash",
  formatting: "deepseek-v4-flash",
};
const DEFAULT_MODEL = "deepseek-v4-flash";

function selectModel(agentRole?: string): string {
  if (agentRole && agentRole in MODEL_ROUTING) {
    return MODEL_ROUTING[agentRole] || DEFAULT_MODEL;
  }
  return DEFAULT_MODEL;
}

// ─── Ckey.vn API Call ────────────────────────────────────────────

async function callCkey(options: ChatCompletionOptions, apiKey: string, apiUrl: string): Promise<ChatCompletionResult> {
  const model = selectModel(options.agentRole);
  options.onLog?.(`AI: calling Ckey.vn ${model}`);

  const body: Record<string, unknown> = {
    model,
    messages: options.messages,
    max_tokens: options.maxTokens ?? 4096,
    temperature: options.temperature ?? 0.2,
  };

  if (options.topP !== undefined) {
    body.top_p = options.topP;
  }

  if (options.responseFormatJson) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(options.timeoutMs ?? 120000),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "unknown");
    throw new Error(`Ckey.vn HTTP ${res.status}: ${err.slice(0, 300)}`);
  }

  const data = await res.json() as any;
  const content = data.choices?.[0]?.message?.content;
  const usedModel = data.model || model;

  if (typeof content !== "string" || !content.trim()) {
    throw new Error(`Ckey.vn ${model} returned empty completion`);
  }

  options.onLog?.(`AI: Ckey.vn ${usedModel} succeeded`);
  return { content, model: usedModel, provider: "ckey" };
}

// ─── Main entry ─────────────────────────────────────────────────
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function generateWithFallbacks(
  options: ChatCompletionOptions,
  apiKey: string,
  apiUrl: string = "https://ckey.vn/v1/chat/completions",
  maxRetries = 3
): Promise<ChatCompletionResult> {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      return await callCkey(options, apiKey, apiUrl);
    } catch (err: any) {
      attempt++;
      const msg = err?.message || 'unknown error';
      console.warn(`[LLM] Ckey.vn attempt ${attempt} failed: ${msg}`);
      
      if (msg.includes('HTTP 4') && !msg.includes('HTTP 429')) {
        throw new Error(`Ckey.vn API call failed (unrecoverable): ${msg}`);
      }
      
      if (attempt >= maxRetries) {
        options.onLog?.(`AI: Ckey.vn failed after ${maxRetries} attempts`);
        throw new Error(`Ckey.vn API call failed after ${maxRetries} attempts: ${msg}.`);
      }
      
      const delay = Math.pow(3, attempt) * 1000;
      await sleep(delay);
    }
  }
  
  throw new Error('Unexpected error in generateWithFallbacks');
}
