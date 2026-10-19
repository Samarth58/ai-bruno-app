import { env } from '../config/env.js';
import {
  AiError,
  AiProviderUnavailableError,
  type AiChatPrompt,
  type AiChatResponse,
  type IAiProvider,
} from './ai.types.js';
import { AnthropicProvider } from './providers/anthropic.provider.js';
import { GeminiAiProvider } from './providers/gemini.provider.js';
import { MockAiProvider } from './providers/mock.provider.js';
import { OpenAiProvider } from './providers/openai.provider.js';

export class AiService {
  private customProvider: IAiProvider | null = null;
  private forceUnconfigured = false;

  constructor(customProvider?: IAiProvider) {
    if (customProvider) {
      this.customProvider = customProvider;
    }
  }

  /**
   * Override provider for testing or runtime swapping.
   */
  public setProvider(provider: IAiProvider | null): void {
    this.customProvider = provider;
  }

  /**
   * Force unconfigured state for testing missing configuration behaviors.
   */
  public setForceUnconfigured(force: boolean): void {
    this.forceUnconfigured = force;
  }

  /**
   * Checks whether an AI provider is configured and ready.
   */
  public isConfigured(): boolean {
    if (this.forceUnconfigured) return false;
    if (this.customProvider) return true;
    const nodeEnv = process.env.NODE_ENV ?? env.NODE_ENV;
    if (nodeEnv === 'test') return true;
    return Boolean(process.env.AI_PROVIDER ?? env.AI_PROVIDER);
  }

  /**
   * Resolves the active provider instance based on environment variables or override.
   */
  public getProvider(): IAiProvider {
    if (this.forceUnconfigured) {
      throw new AiProviderUnavailableError(
        'AI Coach is currently unavailable: No AI provider is configured. Please configure AI_PROVIDER in environment settings.',
      );
    }

    if (this.customProvider) {
      return this.customProvider;
    }

    const providerType =
      process.env.AI_PROVIDER !== undefined ? process.env.AI_PROVIDER : env.AI_PROVIDER;
    const nodeEnv = process.env.NODE_ENV ?? env.NODE_ENV;

    if (!providerType) {
      if (nodeEnv === 'test') {
        return new MockAiProvider();
      }
      throw new AiProviderUnavailableError(
        'AI Coach is currently unavailable: No AI provider is configured. Please configure AI_PROVIDER in environment settings.',
      );
    }

    switch (providerType) {
      case 'mock':
        return new MockAiProvider({
          modelName: env.AI_MODEL ?? 'mock-bruno-v1',
        });

      case 'gemini': {
        const apiKey =
          process.env.GEMINI_API_KEY ||
          env.GEMINI_API_KEY ||
          process.env.AI_API_KEY ||
          env.AI_API_KEY;
        if (!apiKey) {
          throw new AiProviderUnavailableError(
            'AI Coach is currently unavailable: GEMINI_API_KEY or AI_API_KEY is missing for Gemini provider.',
          );
        }
        const modelName = process.env.AI_MODEL || env.AI_MODEL;
        return new GeminiAiProvider({
          apiKey,
          modelName,
          timeoutMs: env.AI_TIMEOUT_MS,
        });
      }

      case 'openai': {
        const apiKey = env.AI_API_KEY;
        if (!apiKey) {
          throw new AiProviderUnavailableError(
            'AI Coach is currently unavailable: AI_API_KEY is missing for OpenAI provider.',
          );
        }
        return new OpenAiProvider({
          apiKey,
          modelName: env.AI_MODEL,
          baseUrl: env.AI_BASE_URL,
          timeoutMs: env.AI_TIMEOUT_MS,
        });
      }

      case 'anthropic': {
        const apiKey = env.AI_API_KEY;
        if (!apiKey) {
          throw new AiProviderUnavailableError(
            'AI Coach is currently unavailable: AI_API_KEY is missing for Anthropic provider.',
          );
        }
        return new AnthropicProvider({
          apiKey,
          modelName: env.AI_MODEL,
          timeoutMs: env.AI_TIMEOUT_MS,
        });
      }

      case 'custom': {
        const apiKey = env.AI_API_KEY || 'no-key-required';
        return new OpenAiProvider({
          apiKey,
          modelName: env.AI_MODEL ?? 'custom-model',
          baseUrl: env.AI_BASE_URL ?? 'http://localhost:11434/v1',
          timeoutMs: env.AI_TIMEOUT_MS,
        });
      }

      default:
        throw new AiProviderUnavailableError(
          `AI Coach is currently unavailable: Unsupported provider type "${providerType}".`,
        );
    }
  }

  /**
   * Generates a chat response using the active provider with standardized error handling.
   */
  public async generateChatResponse(prompt: AiChatPrompt): Promise<AiChatResponse> {
    const provider = this.getProvider();

    try {
      return await provider.generateChatResponse({
        ...prompt,
        maxTokens: prompt.maxTokens ?? env.AI_MAX_TOKENS,
      });
    } catch (err: unknown) {
      if (err instanceof AiError) {
        throw err;
      }

      const errorMessage = err instanceof Error ? err.message : 'Unknown AI provider error';
      throw new AiError(
        `AI provider encountered an error: ${errorMessage}`,
        'SERVICE_UNAVAILABLE',
        503,
      );
    }
  }
}

export const aiService = new AiService();
