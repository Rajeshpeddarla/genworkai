import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ProviderConfig {
  provider: string; // 'openai', 'anthropic', 'gemini', 'openrouter', 'ollama', 'ckey', 'custom'
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
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
  providerConfig?: ProviderConfig; // Optional BYOK config
}

export interface ChatCompletionResult {
  content: string;
  model: string;
  provider: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// ─── Smart Model Routing ─────────────────────────────────────────
const DEFAULT_CKEY_MODEL = "deepseek-v4-flash";

function getModelInstance(options: ChatCompletionOptions, fallbackApiKey: string, fallbackUrl: string) {
  const config = options.providerConfig;
  
  // 1. Fallback / Platform Default
  if (!config || !config.provider) {
    const openai = createOpenAI({
      apiKey: fallbackApiKey,
      baseURL: fallbackUrl,
    });
    return openai(DEFAULT_CKEY_MODEL);
  }

  // 2. BYOK Routing
  const provider = config.provider.toLowerCase();
  const apiKey = config.apiKey;
  const modelName = config.defaultModel || 'gpt-4o'; // Fallback generic name if missing

  switch (provider) {
    case 'openai':
    case 'custom':
    case 'ckey': {
      // All these are OpenAI-compatible endpoints
      const openai = createOpenAI({
        apiKey: apiKey,
        baseURL: config.baseUrl,
      });
      return openai(modelName);
    }
    case 'openrouter': {
      const openai = createOpenAI({
        apiKey: apiKey,
        baseURL: config.baseUrl || 'https://openrouter.ai/api/v1',
      });
      return openai(modelName);
    }
    case 'ollama': {
      const openai = createOpenAI({
        apiKey: apiKey || 'ollama', // ollama requires some string
        baseURL: config.baseUrl || 'http://localhost:11434/v1',
      });
      return openai(modelName);
    }
    case 'anthropic': {
      const anthropic = createAnthropic({
        apiKey: apiKey,
        baseURL: config.baseUrl,
      });
      return anthropic(modelName);
    }
    case 'gemini':
    case 'google': {
      const google = createGoogleGenerativeAI({
        apiKey: apiKey,
        baseURL: config.baseUrl,
      });
      return google(modelName);
    }
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

// ─── Main entry ─────────────────────────────────────────────────
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function generateWithFallbacks(
  options: ChatCompletionOptions,
  fallbackApiKey: string,
  fallbackUrl: string = "https://ckey.vn/v1/chat/completions",
  maxRetries = 3
): Promise<ChatCompletionResult> {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const model = getModelInstance(options, fallbackApiKey, fallbackUrl);
      const providerName = options.providerConfig?.provider || 'ckey (platform)';
      
      options.onLog?.(`AI: Routing to ${providerName}`);

      const { text, usage } = await generateText({
        model: model,
        messages: options.messages as any,
        maxTokens: options.maxTokens,
        temperature: options.temperature,
        topP: options.topP,
        abortSignal: AbortSignal.timeout(options.timeoutMs ?? 120000),
      } as any);

      options.onLog?.(`AI: ${providerName} succeeded`);

      return { 
        content: text, 
        model: model.modelId, 
        provider: providerName,
        usage: {
          promptTokens: (usage as any)?.promptTokens || 0,
          completionTokens: (usage as any)?.completionTokens || 0,
          totalTokens: (usage as any)?.totalTokens || 0,
        }
      };
      
    } catch (err: any) {
      attempt++;
      const msg = err?.message || 'unknown error';
      console.warn(`[LLM] AI Attempt ${attempt} failed: ${msg}`);
      
      if (attempt >= maxRetries) {
        options.onLog?.(`AI: Failed after ${maxRetries} attempts`);
        throw new Error(`AI generation failed after ${maxRetries} attempts: ${msg}`);
      }
      
      const delay = Math.pow(3, attempt) * 1000;
      await sleep(delay);
    }
  }
  
  throw new Error('Unexpected error in generateWithFallbacks');
}
