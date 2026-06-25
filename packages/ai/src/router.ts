export enum TaskCategory {
  FAST = 'fast',
  REASONING = 'reasoning',
  STRUCTURED = 'structured',
  AUTOMATION = 'automation'
}

export interface RouterOptions {
  providerConfig?: any;
  documentCount?: number;
  toolCount?: number;
}

export interface RouterResult {
  model: string;
  provider: string; // 'deepseek' | 'openai' | 'anthropic' etc.
}

const DEEPSEEK_FLASH = 'deepseek-v4-flash';
const DEEPSEEK_PRO = 'deepseek-v4-pro';

// Pricing per 1M tokens
const PRICING = {
  [DEEPSEEK_FLASH]: { input: 0.14, output: 0.28 },
  [DEEPSEEK_PRO]: { input: 0.55, output: 2.19 }, 
  // Default fallback if unknown
  'default': { input: 0.0, output: 0.0 }
};

export class AIRouter {
  
  /**
   * Calculates the estimated cost of an AI request in USD
   */
  static calculateCost(model: string, promptTokens: number, completionTokens: number): string {
    const rates = PRICING[model as keyof typeof PRICING] || PRICING['default'];
    
    const inputCost = (promptTokens / 1_000_000) * rates.input;
    const outputCost = (completionTokens / 1_000_000) * rates.output;
    
    const totalCost = inputCost + outputCost;
    return totalCost.toFixed(6); // Return as string to avoid precision loss
  }

  /**
   * Approximates token count using standard 1:3.3 ratio
   */
  static estimateTokens(text: string): number {
    if (!text) return 0;
    return Math.ceil(text.length / 3.3);
  }

  /**
   * Complexity Detection Layer
   * Returns a score from 1-100 based on prompt size, doc count, and tool count
   */
  static computeComplexityScore(tokenCount: number, docCount: number = 0, toolCount: number = 0): number {
    let score = 0;
    
    // Tokens contribute up to 50 points (maxes out at 30k tokens)
    score += Math.min(50, (tokenCount / 30000) * 50);
    
    // Documents contribute up to 30 points (maxes out at 10 docs)
    score += Math.min(30, (docCount / 10) * 30);
    
    // Tools contribute up to 20 points (maxes out at 5 tools)
    score += Math.min(20, (toolCount / 5) * 20);
    
    return Math.min(100, Math.ceil(score));
  }

  /**
   * Core routing logic
   */
  static getOptimalModel(task: TaskCategory, contextStr: string, options?: RouterOptions): RouterResult {
    // 1. BYOK Support overrides everything
    if (options?.providerConfig && options.providerConfig.provider) {
      return {
        model: options.providerConfig.defaultModel || 'gpt-4o',
        provider: options.providerConfig.provider.toLowerCase()
      };
    }

    // 2. Intelligent Routing for DeepSeek
    const tokenCount = this.estimateTokens(contextStr);

    switch (task) {
      case TaskCategory.FAST:
        return { model: DEEPSEEK_FLASH, provider: 'deepseek' };
        
      case TaskCategory.REASONING:
      case TaskCategory.STRUCTURED:
        return { model: DEEPSEEK_PRO, provider: 'deepseek' };
        
      case TaskCategory.AUTOMATION: {
        // Dynamic Automation Routing
        const docCount = options?.documentCount || 0;
        const toolCount = options?.toolCount || 0;
        
        const score = this.computeComplexityScore(tokenCount, docCount, toolCount);
        
        // Complex Automation -> Pro
        if (score > 40 || tokenCount > 20000) {
          return { model: DEEPSEEK_PRO, provider: 'deepseek' };
        }
        
        // Simple Automation -> Flash
        return { model: DEEPSEEK_FLASH, provider: 'deepseek' };
      }
      
      default:
        return { model: DEEPSEEK_FLASH, provider: 'deepseek' };
    }
  }

  static getFallbackModel(currentModel: string): string | null {
    if (currentModel === DEEPSEEK_PRO) {
      return DEEPSEEK_FLASH;
    }
    // No fallback for Flash, it should just retry
    return null;
  }
}
