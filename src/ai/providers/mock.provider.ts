import {
  AiError,
  AiRateLimitError,
  AiTimeoutError,
  type AiChatPrompt,
  type AiChatResponse,
  type IAiProvider,
} from '../ai.types.js';

export interface MockAiProviderOptions {
  modelName?: string;
  forcedError?: 'timeout' | 'rate_limit' | 'generic' | 'malformed' | null;
  customReply?: string;
  customSuggestedExercises?: string[];
  latencyMs?: number;
}

export class MockAiProvider implements IAiProvider {
  public readonly name = 'mock';
  public readonly modelName: string;
  private options: MockAiProviderOptions;

  constructor(options: MockAiProviderOptions = {}) {
    this.modelName = options.modelName ?? 'mock-bruno-v1';
    this.options = options;
  }

  setOptions(options: Partial<MockAiProviderOptions>): void {
    this.options = { ...this.options, ...options };
  }

  async generateChatResponse(prompt: AiChatPrompt): Promise<AiChatResponse> {
    if (this.options.latencyMs && this.options.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.options.latencyMs));
    }

    if (this.options.forcedError === 'timeout') {
      throw new AiTimeoutError('Mock AI provider simulated request timeout');
    }

    if (this.options.forcedError === 'rate_limit') {
      throw new AiRateLimitError('Mock AI provider simulated rate limit (429)');
    }

    if (this.options.forcedError === 'generic') {
      throw new AiError('Mock AI provider simulated internal failure', 'SERVICE_UNAVAILABLE', 503);
    }

    if (this.options.forcedError === 'malformed') {
      return {
        reply: '',
        providerName: this.name,
        modelName: this.modelName,
      };
    }

    if (this.options.customReply) {
      return {
        reply: this.options.customReply,
        suggestedExercises: this.options.customSuggestedExercises,
        providerName: this.name,
        modelName: this.modelName,
        rawUsage: { promptTokens: 40, completionTokens: 30, totalTokens: 70 },
      };
    }

    // Default friendly Bruno personal trainer response tailored to prompt
    const userMsg = prompt.userMessage.toLowerCase();
    let reply =
      "Hey! Let's get a solid session in today. Stay consistent with your warm-up and focus on controlled reps with good form!";
    let suggestedExercises: string[] = [];

    if (userMsg.includes('push') || userMsg.includes('chest') || userMsg.includes('bench')) {
      reply =
        "Push day it is! We'll target chest, front delts, and triceps with compound pressing followed by isolation work. Focus on a deep stretch on each rep.";
      suggestedExercises = ['Dumbbell Bench Press', 'Push-Up', 'Dumbbell Lateral Raise'];
    } else if (userMsg.includes('pull') || userMsg.includes('back') || userMsg.includes('row')) {
      reply =
        "Pull day is locked in! We'll build that back thickness and bicep strength with controlled rowing and vertical pulling movements.";
      suggestedExercises = ['Chest-Supported Dumbbell Row', 'Dumbbell Bicep Curl'];
    } else if (userMsg.includes('leg') || userMsg.includes('squat')) {
      reply =
        "Leg day incoming! Remember to brace your core and control the eccentric tempo on every repetition.";
      suggestedExercises = ['Bulgarian Split Squat', 'Goblet Squat'];
    } else if (userMsg.includes('substitute') || userMsg.includes('alternative') || userMsg.includes('replace')) {
      reply =
        "Great question! When making an exercise swap, we keep the same movement pattern while matching your equipment and injury constraints.";
      suggestedExercises = ['Belt Squat'];
    }

    return {
      reply,
      suggestedExercises,
      providerName: this.name,
      modelName: this.modelName,
      rawUsage: { promptTokens: 60, completionTokens: 45, totalTokens: 105 },
    };
  }
}
