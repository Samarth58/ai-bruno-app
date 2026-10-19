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

export type AiErrorCategory =
  | 'MODEL_OVERLOADED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'QUOTA_EXHAUSTED'
  | 'INVALID_CREDENTIALS'
  | 'MODEL_NOT_FOUND'
  | 'NETWORK_TIMEOUT'
  | 'UNKNOWN_UPSTREAM_ERROR';

export interface AiErrorOptions {
  category?: AiErrorCategory;
  upstreamStatus?: number;
  provider?: string;
  model?: string;
}

export class AiError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isRetryable: boolean;
  public readonly category: AiErrorCategory;
  public readonly upstreamStatus?: number;
  public readonly provider?: string;
  public readonly model?: string;

  constructor(
    message: string,
    code = 'SERVICE_UNAVAILABLE',
    statusCode = 503,
    isRetryable = false,
    options?: AiErrorOptions,
  ) {
    super(message);
    this.name = 'AiError';
    this.code = code;
    this.statusCode = statusCode;
    this.isRetryable = isRetryable;
    this.category = options?.category ?? 'UNKNOWN_UPSTREAM_ERROR';
    this.upstreamStatus = options?.upstreamStatus;
    this.provider = options?.provider;
    this.model = options?.model;
  }
}

export class AiProviderUnavailableError extends AiError {
  constructor(message = 'AI provider is not configured or unavailable') {
    super(message, 'SERVICE_UNAVAILABLE', 503, false, {
      category: 'UNKNOWN_UPSTREAM_ERROR',
    });
    this.name = 'AiProviderUnavailableError';
  }
}

export class AiTimeoutError extends AiError {
  constructor(
    message = 'AI provider request timed out',
    options?: AiErrorOptions,
  ) {
    super(message, 'SERVICE_UNAVAILABLE', 504, true, {
      category: 'NETWORK_TIMEOUT',
      ...options,
    });
    this.name = 'AiTimeoutError';
  }
}

export class AiRateLimitError extends AiError {
  constructor(
    message = 'AI provider rate limit exceeded',
    options?: AiErrorOptions,
  ) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, true, {
      category: 'RATE_LIMIT_EXCEEDED',
      ...options,
    });
    this.name = 'AiRateLimitError';
  }
}

export class AiOverloadedError extends AiError {
  constructor(
    message = 'The AI model is currently experiencing high demand. Please try again in a few moments.',
    options?: AiErrorOptions,
  ) {
    super(message, 'SERVICE_UNAVAILABLE', 503, true, {
      category: 'MODEL_OVERLOADED',
      ...options,
    });
    this.name = 'AiOverloadedError';
  }
}

export class AiQuotaExhaustedError extends AiError {
  constructor(
    message = 'AI Coach daily quota has been reached. Please try again later.',
    options?: AiErrorOptions,
  ) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, false, {
      category: 'QUOTA_EXHAUSTED',
      ...options,
    });
    this.name = 'AiQuotaExhaustedError';
  }
}

export class AiInvalidCredentialsError extends AiError {
  constructor(
    message = 'AI Coach is temporarily unavailable due to a configuration issue. Please contact support.',
    options?: AiErrorOptions,
  ) {
    super(message, 'SERVICE_UNAVAILABLE', 503, false, {
      category: 'INVALID_CREDENTIALS',
      ...options,
    });
    this.name = 'AiInvalidCredentialsError';
  }
}

export class AiModelNotFoundError extends AiError {
  constructor(
    message = 'The configured AI model is currently unavailable.',
    options?: AiErrorOptions,
  ) {
    super(message, 'SERVICE_UNAVAILABLE', 503, false, {
      category: 'MODEL_NOT_FOUND',
      ...options,
    });
    this.name = 'AiModelNotFoundError';
  }
}
