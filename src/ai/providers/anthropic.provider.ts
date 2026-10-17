import {
  AiError,
  AiRateLimitError,
  AiTimeoutError,
  type AiChatPrompt,
  type AiChatResponse,
  type IAiProvider,
} from '../ai.types.js';

export interface AnthropicProviderOptions {
  apiKey: string;
  modelName?: string;
  timeoutMs?: number;
}

export class AnthropicProvider implements IAiProvider {
  public readonly name = 'anthropic';
  public readonly modelName: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;

  constructor(options: AnthropicProviderOptions) {
    if (!options.apiKey) {
      throw new Error('Anthropic API key is required');
    }
    this.apiKey = options.apiKey;
    this.modelName = options.modelName ?? 'claude-3-5-haiku-20241022';
    this.timeoutMs = options.timeoutMs ?? 15000;
  }

  async generateChatResponse(prompt: AiChatPrompt): Promise<AiChatResponse> {
    const url = 'https://api.anthropic.com/v1/messages';

    const bodyPayload = {
      model: this.modelName,
      max_tokens: prompt.maxTokens ?? 500,
      system: prompt.systemPrompt,
      messages: [{ role: 'user', content: prompt.userMessage }],
    };

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(bodyPayload),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (err: unknown) {
      if (err instanceof Error && (err.name === 'AbortError' || err.name === 'TimeoutError')) {
        throw new AiTimeoutError(`Anthropic request timed out after ${this.timeoutMs}ms`);
      }
      throw new AiError(
        `Anthropic network communication failed: ${err instanceof Error ? err.message : String(err)}`,
        'SERVICE_UNAVAILABLE',
        503,
      );
    }

    if (response.status === 429) {
      throw new AiRateLimitError('Anthropic rate limit exceeded');
    }

    if (!response.ok) {
      let errorMessage = `Anthropic returned HTTP ${response.status}`;
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
      throw new AiError('Failed to parse Anthropic response as JSON', 'SERVICE_UNAVAILABLE', 503);
    }

    const textPart = data?.content?.find((p: any) => p.type === 'text')?.text;
    if (typeof textPart !== 'string' || textPart.trim().length === 0) {
      throw new AiError('Anthropic returned an empty completion', 'SERVICE_UNAVAILABLE', 503);
    }

    return {
      reply: textPart.trim(),
      providerName: this.name,
      modelName: this.modelName,
      rawUsage: data?.usage
        ? {
            promptTokens: data.usage.input_tokens,
            completionTokens: data.usage.output_tokens,
            totalTokens: (data.usage.input_tokens || 0) + (data.usage.output_tokens || 0),
          }
        : undefined,
    };
  }
}
