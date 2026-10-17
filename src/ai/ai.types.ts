export interface AiChatPrompt {
  systemPrompt: string;
  userMessage: string;
  context?: Record<string, unknown>;
  maxTokens?: number;
  temperature?: number;
}

export interface AiChatResponse {
  reply: string;
  suggestedExercises?: string[];
  providerName: string;
  modelName: string;
  rawUsage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface IAiProvider {
  readonly name: string;
  readonly modelName: string;
  generateChatResponse(prompt: AiChatPrompt): Promise<AiChatResponse>;
}

export type AiProviderType = 'gemini' | 'openai' | 'anthropic' | 'custom' | 'mock';

export interface AiProviderConfig {
  provider?: AiProviderType;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  timeoutMs?: number;
  maxTokens?: number;
}

export class AiError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isRetryable: boolean;

  constructor(
    message: string,
    code = 'SERVICE_UNAVAILABLE',
    statusCode = 503,
    isRetryable = false,
  ) {
    super(message);
    this.name = 'AiError';
    this.code = code;
    this.statusCode = statusCode;
    this.isRetryable = isRetryable;
  }
}

export class AiProviderUnavailableError extends AiError {
  constructor(message = 'AI provider is not configured or unavailable') {
    super(message, 'SERVICE_UNAVAILABLE', 503, false);
    this.name = 'AiProviderUnavailableError';
  }
}

export class AiTimeoutError extends AiError {
  constructor(message = 'AI provider request timed out') {
    super(message, 'SERVICE_UNAVAILABLE', 504, true);
    this.name = 'AiTimeoutError';
  }
}

export class AiRateLimitError extends AiError {
  constructor(message = 'AI provider rate limit exceeded') {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, true);
    this.name = 'AiRateLimitError';
  }
}
