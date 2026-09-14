import { AIProvider, AITicketContext } from './AIProvider';
import { DemoAIProvider } from './DemoAIProvider';
import { GeminiAIProvider } from './GeminiAIProvider';
import { GroqAIProvider } from './GroqAIProvider';
import { ENV } from '../config/env';
import { AIAnalysisResult } from '../types';

export class AIFactory {
  private static demoProvider = new DemoAIProvider();

  public static getProvider(): AIProvider {
    const selected = (ENV.AI_PROVIDER || 'demo').toLowerCase();

    if (selected === 'gemini' && ENV.GEMINI_API_KEY) {
      return new GeminiAIProvider(ENV.GEMINI_API_KEY);
    }

    if (selected === 'groq' && ENV.GROQ_API_KEY) {
      return new GroqAIProvider(ENV.GROQ_API_KEY, ENV.GROQ_MODEL);
    }

    return this.demoProvider;
  }

  public static async analyzeWithFallback(input: AITicketContext): Promise<AIAnalysisResult> {
    const provider = this.getProvider();

    // If already demo, run directly
    if (provider.name === 'DemoAIProvider') {
      return provider.analyzeServiceTicket(input);
    }

    try {
      console.log(`[AI] Dispatching analysis to provider: ${provider.name}`);
      // Timeout promise after 12 seconds
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI request timed out after 12s')), 12000)
      );

      const result = await Promise.race([provider.analyzeServiceTicket(input), timeoutPromise]);
      return result;
    } catch (error: any) {
      console.warn(`[AI Warning] Provider ${provider.name} failed (${error.message}). Gracefully falling back to DemoAIProvider.`);
      const fallbackResult = await this.demoProvider.analyzeServiceTicket(input);
      return {
        ...fallbackResult,
        reasoning: `${fallbackResult.reasoning} (Note: Analysis generated via deterministic Demo rules because ${provider.name} was unreachable).`,
      };
    }
  }

  public static async getProviderStatus(): Promise<{
    activeProvider: string;
    configured: string;
    isFallback: boolean;
    details: string;
  }> {
    const configured = (ENV.AI_PROVIDER || 'demo').toLowerCase();
    const provider = this.getProvider();
    const health = await provider.healthCheck();

    return {
      activeProvider: provider.name,
      configured,
      isFallback: provider.name === 'DemoAIProvider' && configured !== 'demo',
      details: health.details || 'Operational',
    };
  }
}
