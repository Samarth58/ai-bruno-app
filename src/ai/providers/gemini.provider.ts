import {
  AiError,
  AiRateLimitError,
  AiTimeoutError,
  type AiChatPrompt,
  type AiChatResponse,
  type IAiProvider,
} from '../ai.types.js';

export interface GeminiProviderOptions {
  apiKey: string;
  modelName?: string;
  timeoutMs?: number;
}

export class GeminiAiProvider implements IAiProvider {
  public readonly name = 'gemini';
  public readonly modelName: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;

  constructor(options: GeminiProviderOptions) {
    if (!options.apiKey) {
      throw new Error('Gemini API key is required');
    }
    this.apiKey = options.apiKey;
    this.modelName = options.modelName ?? 'gemini-3.8-flash';
    this.timeoutMs = options.timeoutMs ?? 15000;
  }

  async generateChatResponse(prompt: AiChatPrompt): Promise<AiChatResponse> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      this.modelName,
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
      if (err instanceof Error && (err.name === 'AbortError' || err.name === 'TimeoutError')) {
        throw new AiTimeoutError(`Gemini request timed out after ${this.timeoutMs}ms`);
      }
      throw new AiError(
        `Gemini network communication failed: ${err instanceof Error ? err.message : String(err)}`,
        'SERVICE_UNAVAILABLE',
        503,
      );
    }

    if (response.status === 429) {
      throw new AiRateLimitError('Gemini API quota or rate limit exceeded');
    }

    if (!response.ok) {
      let errorMessage = `Gemini returned HTTP ${response.status}`;
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
      throw new AiError('Failed to parse Gemini response as JSON', 'SERVICE_UNAVAILABLE', 503);
    }

    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof candidateText !== 'string' || candidateText.trim().length === 0) {
      throw new AiError('Gemini returned an empty or malformed completion', 'SERVICE_UNAVAILABLE', 503);
    }

    return {
      reply: candidateText.trim(),
      providerName: this.name,
      modelName: this.modelName,
      rawUsage: data?.usageMetadata
        ? {
            promptTokens: data.usageMetadata.promptTokenCount,
            completionTokens: data.usageMetadata.candidatesTokenCount,
            totalTokens: data.usageMetadata.totalTokenCount,
          }
        : undefined,
    };
  }
}
