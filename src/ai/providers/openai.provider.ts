import {
  AiError,
  AiRateLimitError,
  AiTimeoutError,
  type AiChatPrompt,
  type AiChatResponse,
  type IAiProvider,
} from '../ai.types.js';

export interface OpenAiProviderOptions {
  apiKey: string;
  modelName?: string;
  baseUrl?: string;
  timeoutMs?: number;
}

export class OpenAiProvider implements IAiProvider {
  public readonly name = 'openai';
  public readonly modelName: string;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(options: OpenAiProviderOptions) {
    if (!options.apiKey) {
      throw new Error('OpenAI API key is required');
    }
    this.apiKey = options.apiKey;
    this.modelName = options.modelName ?? 'gpt-4o-mini';
    this.baseUrl = (options.baseUrl ?? 'https://api.openai.com/v1').replace(/\/+$/, '');
    this.timeoutMs = options.timeoutMs ?? 15000;
  }

  async generateChatResponse(prompt: AiChatPrompt): Promise<AiChatResponse> {
    const url = `${this.baseUrl}/chat/completions`;

    const bodyPayload = {
      model: this.modelName,
      messages: [
        { role: 'system', content: prompt.systemPrompt },
        { role: 'user', content: prompt.userMessage },
      ],
      temperature: prompt.temperature ?? 0.7,
      max_tokens: prompt.maxTokens ?? 500,
    };

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(bodyPayload),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (err: unknown) {
      if (err instanceof Error && (err.name === 'AbortError' || err.name === 'TimeoutError')) {
        throw new AiTimeoutError(`OpenAI request timed out after ${this.timeoutMs}ms`);
      }
      throw new AiError(
        `OpenAI network communication failed: ${err instanceof Error ? err.message : String(err)}`,
        'SERVICE_UNAVAILABLE',
        503,
      );
    }

    if (response.status === 429) {
      throw new AiRateLimitError('OpenAI rate limit or credit quota exceeded');
    }

    if (!response.ok) {
      let errorMessage = `OpenAI returned HTTP ${response.status}`;
      try {
        const errorJson = (await response.json()) as { error?: { message?: string } };
        if (errorJson?.error?.message) {
          errorMessage = errorJson.error.message;
        }
      } catch {
        // Ignore JSON parse errors on error responses
      }
      throw new AiError(errorMessage, 'SERVICE_UNAVAILABLE', response.status >= 500 ? 503 : 500);
    }

    let data: any;
    try {
      data = await response.json();
    } catch {
      throw new AiError('Failed to parse OpenAI response as JSON', 'SERVICE_UNAVAILABLE', 503);
    }

    const messageContent = data?.choices?.[0]?.message?.content;
    if (typeof messageContent !== 'string' || messageContent.trim().length === 0) {
      throw new AiError('OpenAI returned an empty or malformed completion', 'SERVICE_UNAVAILABLE', 503);
    }

    return {
      reply: messageContent.trim(),
      providerName: this.name,
      modelName: this.modelName,
      rawUsage: data?.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
    };
  }
}
