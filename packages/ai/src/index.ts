import { generateText } from 'ai';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { AIRouter, TaskCategory, RouterOptions, RouterResult } from './router';

export { TaskCategory, AIRouter } from './router';

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ProviderConfig {
  provider: string; // 'openai', 'anthropic', 'gemini', 'openrouter', 'ollama', 'createDeepSeek', 'custom'
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
}

export interface ChatCompletionOptions {
  system?: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  responseFormatJson?: boolean;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  
  // Intelligent Routing Configuration
  taskCategory?: TaskCategory;
  documentCount?: number;
  toolCount?: number;
  
  onLog?: (msg: string) => void;
  timeoutMs?: number;
  providerConfig?: ProviderConfig; // BYOK config
}

export interface ChatCompletionResult {
  content: string;
  model: string;
  provider: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCost: string;
  };
}

// ─── Smart Model Routing ─────────────────────────────────────────

function getModelInstance(
  route: RouterResult, 
  options: ChatCompletionOptions, 
  fallbackApiKey: string, 
  fallbackUrl: string
) {
  const config = options.providerConfig;
  const isPlatformProvider = !config || !config.provider;
  
  const providerType = isPlatformProvider ? route.provider : config.provider.toLowerCase();
  const apiKey = isPlatformProvider ? fallbackApiKey : config.apiKey;
  const baseUrl = isPlatformProvider ? fallbackUrl : config.baseUrl;
  const modelName = route.model;

  switch (providerType) {
    case 'openai':
    case 'custom':
    case 'deepseek':
    case 'createDeepSeek': {
      // All these are OpenAI-compatible endpoints
      const openai = createDeepSeek({
        apiKey: apiKey,
        baseURL: baseUrl,
      });
      return openai.chat(modelName);
    }
    case 'openrouter': {
      const openai = createDeepSeek({
        apiKey: apiKey,
        baseURL: baseUrl || 'https://openrouter.ai/api/v1',
      });
      return openai.chat(modelName);
    }

    case 'anthropic': {
      const anthropic = createAnthropic({
        apiKey: apiKey,
        baseURL: baseUrl,
      });
      return anthropic(modelName);
    }
    case 'gemini':
    case 'google': {
      const googleConfig: any = { apiKey: apiKey };
      if (baseUrl) googleConfig.baseURL = baseUrl;
      
      const google = createGoogleGenerativeAI(googleConfig);
      return google(modelName);
    }
    default:
      throw new Error(`Unsupported provider: ${providerType}`);
  }
}

// ─── Main entry ─────────────────────────────────────────────────
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function generateWithFallbacks(
  options: ChatCompletionOptions,
  fallbackApiKey: string,
  fallbackUrl?: string, // Let Vercel SDK use default provider URLs
  maxRetries = 3
): Promise<ChatCompletionResult> {
  let attempt = 0;
  
  // Calculate full context size for routing
  const contextStr = options.messages.map(m => m.content).join('\n');
  const taskCategory = options.taskCategory || TaskCategory.FAST;
  
  let currentRoute = AIRouter.getOptimalModel(taskCategory, contextStr, {
    providerConfig: options.providerConfig,
    documentCount: options.documentCount,
    toolCount: options.toolCount
  });

  while (attempt < maxRetries) {
    try {
      const model = getModelInstance(currentRoute, options, fallbackApiKey, fallbackUrl || '');
      const providerName = options.providerConfig?.provider || 'platform_gemini';
      
      options.onLog?.(`AI: Routing to ${providerName} using model ${currentRoute.model}`);

      const { text, usage } = await generateText({
        model: model,
        system: options.system,
        messages: options.messages.filter(m => m.role !== 'system') as any,
        maxTokens: options.maxTokens,
        temperature: options.temperature,
        topP: options.topP,
        abortSignal: AbortSignal.timeout(options.timeoutMs ?? 120000),
      } as any);

      options.onLog?.(`AI: ${providerName} (${currentRoute.model}) succeeded`);

      const pTokens = (usage as any)?.promptTokens || 0;
      const cTokens = (usage as any)?.completionTokens || 0;
      const tTokens = (usage as any)?.totalTokens || 0;
      const estimatedCost = AIRouter.calculateCost(currentRoute.model, pTokens, cTokens);

      return { 
        content: text, 
        model: currentRoute.model, 
        provider: providerName,
        usage: {
          promptTokens: pTokens,
          completionTokens: cTokens,
          totalTokens: tTokens,
          estimatedCost: estimatedCost
        }
      };
      
    } catch (err: any) {
      attempt++;
      const msg = err?.message || 'unknown error';
      console.warn(`[LLM] AI Attempt ${attempt} failed with ${currentRoute.model}: ${msg}`);
      
      // Fallback Engine Logic
      const fallbackModel = AIRouter.getFallbackModel(currentRoute.model);
      
      if (fallbackModel && attempt < maxRetries) {
        options.onLog?.(`AI: Falling back from ${currentRoute.model} to ${fallbackModel}`);
        currentRoute.model = fallbackModel;
      } else if (attempt >= maxRetries) {
        options.onLog?.(`AI: Failed after ${maxRetries} attempts`);
        throw new Error(`AI generation failed after ${maxRetries} attempts: ${msg}`);
      }
      
      const delay = Math.pow(3, attempt) * 1000;
      await sleep(delay);
    }
  }
  
  throw new Error('Unexpected error in generateWithFallbacks');
}

import { streamText } from 'ai';

export async function streamWithFallbacks(
  options: ChatCompletionOptions,
  fallbackApiKey: string,
  fallbackUrl?: string, // Let Vercel SDK use default provider URLs
  maxRetries = 3
): Promise<any> {
  let attempt = 0;
  
  const contextStr = options.messages.map(m => m.content).join('\n');
  const taskCategory = options.taskCategory || TaskCategory.FAST;
  
  let currentRoute = AIRouter.getOptimalModel(taskCategory, contextStr, {
    providerConfig: options.providerConfig,
    documentCount: options.documentCount,
    toolCount: options.toolCount
  });

  while (attempt < maxRetries) {
    try {
      const model = getModelInstance(currentRoute, options, fallbackApiKey, fallbackUrl || '');
      const providerName = options.providerConfig?.provider || 'platform_gemini';
      
      options.onLog?.(`AI (Stream): Routing to ${providerName} using model ${currentRoute.model}`);

      const result = await streamText({
        model: model,
        system: options.system,
        messages: options.messages.filter(m => m.role !== 'system') as any,
        maxTokens: options.maxTokens,
        temperature: options.temperature,
        topP: options.topP,
        abortSignal: AbortSignal.timeout(options.timeoutMs ?? 120000),
      } as any);

      return result;
      
    } catch (err: any) {
      attempt++;
      const msg = err?.message || 'unknown error';
      console.warn(`[LLM Stream] AI Attempt ${attempt} failed with ${currentRoute.model}: ${msg}`);
      
      const fallbackModel = AIRouter.getFallbackModel(currentRoute.model);
      
      if (fallbackModel && attempt < maxRetries) {
        options.onLog?.(`AI (Stream): Falling back from ${currentRoute.model} to ${fallbackModel}`);
        currentRoute.model = fallbackModel;
      } else if (attempt >= maxRetries) {
        options.onLog?.(`AI (Stream): Failed after ${maxRetries} attempts`);
        throw new Error(`AI generation failed after ${maxRetries} attempts: ${msg}`);
      }
      
      const delay = Math.pow(3, attempt) * 1000;
      await sleep(delay);
    }
  }
  
  throw new Error('Unexpected error in streamWithFallbacks');
}
