import {
  AiError,
  AiInvalidCredentialsError,
  AiModelNotFoundError,
  AiOverloadedError,
  AiQuotaExhaustedError,
  AiRateLimitError,
  AiTimeoutError,
  type AiChatPrompt,
  type AiChatResponse,
  type AiErrorCategory,
  type IAiProvider,
} from '../ai.types.js';

export interface GeminiRetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
}

export interface GeminiProviderOptions {
  apiKey: string;
  modelName?: string;
  timeoutMs?: number;
  retryOptions?: GeminiRetryOptions;
  fallbackModels?: string[];
}

export interface GeminiErrorClassification {
  category: AiErrorCategory;
  upstreamStatus: number;
  clientMessage: string;
  isRetryable: boolean;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Parses upstream Gemini HTTP error responses into categorized, safe error details.
 * Prevents leaking raw internal error objects or keys.
 */
export function classifyGeminiError(
  status: number,
  bodyText?: string,
): GeminiErrorClassification {
  let parsedMessage = '';
  let parsedStatus = '';
  let parsedReason = '';

  if (bodyText) {
    try {
      const json = JSON.parse(bodyText);
      parsedMessage = json?.error?.message ?? '';
      parsedStatus = json?.error?.status ?? '';
      if (Array.isArray(json?.error?.details)) {
        for (const detail of json.error.details) {
          if (detail?.reason) {
            parsedReason = String(detail.reason);
            break;
          }
        }
      }
    } catch {
      parsedMessage = bodyText.slice(0, 200);
    }
  }

  const combined = `${parsedStatus} ${parsedReason} ${parsedMessage}`.toLowerCase();

  // 1. Invalid API Key / Permissions
  if (
    status === 401 ||
    status === 403 ||
    parsedReason === 'API_KEY_INVALID' ||
    combined.includes('api key not valid') ||
    combined.includes('api_key_invalid') ||
    combined.includes('permission_denied')
  ) {
    return {
      category: 'INVALID_CREDENTIALS',
      upstreamStatus: status,
      clientMessage:
        'AI Coach is temporarily unavailable due to a provider configuration issue. Please contact support.',
      isRetryable: false,
    };
  }

  // 2. Model Not Found / Unsupported Model
  if (
    status === 404 ||
    parsedStatus === 'NOT_FOUND' ||
    combined.includes('not found') ||
    combined.includes('is not supported')
  ) {
    return {
      category: 'MODEL_NOT_FOUND',
      upstreamStatus: status,
      clientMessage: 'The configured AI model is currently unavailable.',
      isRetryable: false,
    };
  }

  // 3. Quota Exhaustion vs Rate Limiting (HTTP 429)
  if (status === 429 || parsedStatus === 'RESOURCE_EXHAUSTED') {
    if (
      combined.includes('quota') ||
      combined.includes('free tier') ||
      combined.includes('billing') ||
      parsedReason === 'QUOTA_EXCEEDED'
    ) {
      return {
        category: 'QUOTA_EXHAUSTED',
        upstreamStatus: status,
        clientMessage:
          'AI Coach daily quota has been reached. Please try again later.',
        isRetryable: false,
      };
    }

    return {
      category: 'RATE_LIMIT_EXCEEDED',
      upstreamStatus: status,
      clientMessage:
        'AI Coach rate limit exceeded. Please wait a moment before sending another message.',
      isRetryable: true,
    };
  }

  // 4. Model Overload / High Demand (HTTP 503 / 502 / UNAVAILABLE)
  if (
    status === 503 ||
    status === 502 ||
    parsedStatus === 'UNAVAILABLE' ||
    combined.includes('high demand') ||
    combined.includes('spikes in demand') ||
    combined.includes('overloaded')
  ) {
    return {
      category: 'MODEL_OVERLOADED',
      upstreamStatus: status,
      clientMessage:
        'The AI model is currently experiencing high demand. Please try again in a few moments.',
      isRetryable: true,
    };
  }

  // 5. Server Deadline / Timeout (HTTP 504)
  if (status === 504 || parsedStatus === 'DEADLINE_EXCEEDED' || combined.includes('deadline')) {
    return {
      category: 'NETWORK_TIMEOUT',
      upstreamStatus: status,
      clientMessage: 'AI Coach request timed out. Please try again.',
      isRetryable: true,
    };
  }

  // 6. Generic Upstream Error
  return {
    category: 'UNKNOWN_UPSTREAM_ERROR',
    upstreamStatus: status,
    clientMessage:
      status >= 500
        ? 'The AI model is currently experiencing high demand. Please try again in a moment.'
        : 'AI Coach encountered a temporary upstream error. Please try again.',
    isRetryable: status >= 500,
  };
}

export class GeminiAiProvider implements IAiProvider {
  public readonly name = 'gemini';
  public readonly modelName: string;
  public readonly fallbackModels: string[];
  private readonly apiKey: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly initialDelayMs: number;
  private readonly maxDelayMs: number;

  constructor(options: GeminiProviderOptions) {
    if (!options.apiKey) {
      throw new Error('Gemini API key is required');
    }
    this.apiKey = options.apiKey;
    this.modelName = options.modelName ?? 'gemini-3.8-flash';
    this.timeoutMs = options.timeoutMs ?? 15000;
    this.maxRetries = options.retryOptions?.maxRetries ?? 2;
    this.initialDelayMs = options.retryOptions?.initialDelayMs ?? 800;
    this.maxDelayMs = options.retryOptions?.maxDelayMs ?? 3000;
    this.fallbackModels = options.fallbackModels ?? (
      this.modelName === 'gemini-3.8-flash'
        ? ['gemini-3.5-flash-lite', 'gemini-3.5-flash']
        : []
    );
  }

  /**
   * Safe logger that logs provider name, model, upstream status, and error category,
   * without logging API keys or authorization headers.
   */
  private logSanitized(
    level: 'warn' | 'error',
    data: {
      model: string;
      upstreamStatus: number;
      errorCategory: AiErrorCategory;
      attempt: number;
      maxAttempts: number;
      isRetryable: boolean;
      delayMs?: number;
    },
  ): void {
    if (process.env.NODE_ENV === 'test') return;
    const logData = {
      provider: this.name,
      model: data.model,
      upstreamStatus: data.upstreamStatus,
      errorCategory: data.errorCategory,
      attempt: `${data.attempt}/${data.maxAttempts}`,
      isRetryable: data.isRetryable,
      ...(data.delayMs !== undefined ? { retryInMs: data.delayMs } : {}),
    };
    if (level === 'error') {
      console.error('[GeminiAiProvider] Upstream error:', JSON.stringify(logData));
    } else {
      console.warn('[GeminiAiProvider] Transient upstream error:', JSON.stringify(logData));
    }
  }

  /**
   * Executes prompt against a specific model with bounded retries and exponential backoff.
   */
  private async executeWithModel(
    targetModel: string,
    prompt: AiChatPrompt,
  ): Promise<AiChatResponse> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      targetModel,
    )}:generateContent`;

    const bodyPayload = {
      system_instruction: {
        parts: [{ text: prompt.systemPrompt }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt.userMessage }],
        },
      ],
      generationConfig: {
        temperature: prompt.temperature ?? 0.7,
        maxOutputTokens: prompt.maxTokens ?? 500,
      },
    };

    let attempt = 0;
    const maxAttempts = this.maxRetries + 1;

    while (attempt < maxAttempts) {
      attempt++;

      let response: Response;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': this.apiKey,
          },
          body: JSON.stringify(bodyPayload),
          signal: AbortSignal.timeout(this.timeoutMs),
        });
      } catch (err: unknown) {
        const isTimeout =
          err instanceof Error &&
          (err.name === 'AbortError' || err.name === 'TimeoutError');

        const delay = Math.min(
          this.initialDelayMs * Math.pow(2, attempt - 1),
          this.maxDelayMs,
        );

        this.logSanitized('warn', {
          model: targetModel,
          upstreamStatus: isTimeout ? 504 : 0,
          errorCategory: isTimeout ? 'NETWORK_TIMEOUT' : 'UNKNOWN_UPSTREAM_ERROR',
          attempt,
          maxAttempts,
          isRetryable: isTimeout,
          delayMs: isTimeout && attempt < maxAttempts ? delay : undefined,
        });

        if (isTimeout && attempt < maxAttempts) {
          await sleep(delay);
          continue;
        }

        if (isTimeout) {
          throw new AiTimeoutError(`Gemini request timed out after ${this.timeoutMs}ms`, {
            provider: this.name,
            model: targetModel,
            upstreamStatus: 504,
          });
        }

        throw new AiError(
          'Gemini network communication failed. Please try again.',
          'SERVICE_UNAVAILABLE',
          503,
          false,
          {
            category: 'UNKNOWN_UPSTREAM_ERROR',
            provider: this.name,
            model: targetModel,
          },
        );
      }

      // Success branch
      if (response.ok) {
        let data: any;
        try {
          data = await response.json();
        } catch {
          throw new AiError(
            'Failed to parse Gemini response as JSON',
            'SERVICE_UNAVAILABLE',
            503,
            false,
            {
              category: 'UNKNOWN_UPSTREAM_ERROR',
              provider: this.name,
              model: targetModel,
              upstreamStatus: response.status,
            },
          );
        }

        const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (typeof candidateText !== 'string' || candidateText.trim().length === 0) {
          throw new AiError(
            'Gemini returned an empty or malformed completion',
            'SERVICE_UNAVAILABLE',
            503,
            false,
            {
              category: 'UNKNOWN_UPSTREAM_ERROR',
              provider: this.name,
              model: targetModel,
              upstreamStatus: response.status,
            },
          );
        }

        return {
          reply: candidateText.trim(),
          providerName: this.name,
          modelName: targetModel,
          rawUsage: data?.usageMetadata
            ? {
                promptTokens: data.usageMetadata.promptTokenCount,
                completionTokens: data.usageMetadata.candidatesTokenCount,
                totalTokens: data.usageMetadata.totalTokenCount,
              }
            : undefined,
        };
      }

      // Error branch: read response text for classification
      let bodyText = '';
      try {
        bodyText = await response.text();
      } catch {
        // empty body
      }

      const classification = classifyGeminiError(response.status, bodyText);

      // Compute retry delay if retryable
      let delay = Math.min(
        this.initialDelayMs * Math.pow(2, attempt - 1),
        this.maxDelayMs,
      );
      const retryAfterHeader = response.headers.get('retry-after');
      if (retryAfterHeader) {
        const parsedSec = parseInt(retryAfterHeader, 10);
        if (!isNaN(parsedSec) && parsedSec > 0) {
          delay = Math.min(parsedSec * 1000, this.maxDelayMs);
        }
      }

      this.logSanitized(classification.isRetryable ? 'warn' : 'error', {
        model: targetModel,
        upstreamStatus: classification.upstreamStatus,
        errorCategory: classification.category,
        attempt,
        maxAttempts,
        isRetryable: classification.isRetryable,
        delayMs: classification.isRetryable && attempt < maxAttempts ? delay : undefined,
      });

      // Transient retry branch within the same model
      if (classification.isRetryable && attempt < maxAttempts) {
        await sleep(delay);
        continue;
      }

      // Throw appropriate categorized AiError
      const errOptions = {
        upstreamStatus: classification.upstreamStatus,
        provider: this.name,
        model: targetModel,
      };

      switch (classification.category) {
        case 'MODEL_OVERLOADED':
          throw new AiOverloadedError(classification.clientMessage, errOptions);
        case 'QUOTA_EXHAUSTED':
          throw new AiQuotaExhaustedError(classification.clientMessage, errOptions);
        case 'RATE_LIMIT_EXCEEDED':
          throw new AiRateLimitError(classification.clientMessage, errOptions);
        case 'INVALID_CREDENTIALS':
          throw new AiInvalidCredentialsError(classification.clientMessage, errOptions);
        case 'MODEL_NOT_FOUND':
          throw new AiModelNotFoundError(classification.clientMessage, errOptions);
        case 'NETWORK_TIMEOUT':
          throw new AiTimeoutError(classification.clientMessage, errOptions);
        default:
          throw new AiError(
            classification.clientMessage,
            'SERVICE_UNAVAILABLE',
            response.status >= 500 ? 503 : 500,
            false,
            { category: classification.category, ...errOptions },
          );
      }
    }

    throw new AiError(
      'AI Coach request failed after retry attempts.',
      'SERVICE_UNAVAILABLE',
      503,
      false,
      {
        category: 'MODEL_OVERLOADED',
        provider: this.name,
        model: targetModel,
      },
    );
  }

  /**
   * Main entrypoint with primary model execution and automatic model failover
   * if the primary model is experiencing severe data-center capacity spikes (MODEL_OVERLOADED).
   */
  async generateChatResponse(prompt: AiChatPrompt): Promise<AiChatResponse> {
    const modelsToTry = [
      this.modelName,
      ...this.fallbackModels.filter((m) => m !== this.modelName),
    ];
    let lastError: unknown = null;

    for (let mIdx = 0; mIdx < modelsToTry.length; mIdx++) {
      const currentModel = modelsToTry[mIdx];
      try {
        return await this.executeWithModel(currentModel, prompt);
      } catch (err: unknown) {
        lastError = err;

        // Only failover to fallback models if the error is MODEL_OVERLOADED (503)
        const canFailover =
          err instanceof AiOverloadedError ||
          (err instanceof AiError && err.category === 'MODEL_OVERLOADED');

        if (canFailover && mIdx < modelsToTry.length - 1) {
          const nextModel = modelsToTry[mIdx + 1];
          if (process.env.NODE_ENV !== 'test') {
            console.warn(
              `[GeminiAiProvider] Primary model "${currentModel}" is experiencing high demand. Seamlessly attempting fallback model "${nextModel}"...`,
            );
          }
          continue;
        }

        throw err;
      }
    }

    throw lastError;
  }
}
