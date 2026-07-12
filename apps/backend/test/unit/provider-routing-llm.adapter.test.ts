import { describe, expect, it } from 'vitest';
import { LlmRequestFailedError } from '../../src/contexts/ai/modules/chat/domain/chat';
import { ProviderRoutingLlmAdapter } from '../../src/contexts/ai/modules/chat/infra/provider-routing-llm.adapter';
import type {
  LlmGenerateInput,
  LlmGenerateResult,
  LlmProviderPort,
} from '../../src/contexts/ai/modules/chat/ports/llm-provider.port';

class RecordingLlm implements LlmProviderPort {
  lastInput: LlmGenerateInput | null = null;
  constructor(private readonly reply: string) {}

  async generate(input: LlmGenerateInput): Promise<LlmGenerateResult> {
    this.lastInput = input;
    return { content: this.reply, tokensInput: null, tokensOutput: null };
  }
}

const BASE_INPUT: Omit<LlmGenerateInput, 'provider'> = {
  apiKey: 'key',
  model: 'some-model',
  systemPrompt: 'sos un asistente',
  history: [],
  userMessage: 'hola',
};

describe('ProviderRoutingLlmAdapter', () => {
  it('dispatches to the adapter registered for the provider', async () => {
    const gemini = new RecordingLlm('respuesta gemini');
    const ollama = new RecordingLlm('respuesta ollama');
    const router = new ProviderRoutingLlmAdapter({ gemini, ollama });

    const result = await router.generate({ ...BASE_INPUT, provider: 'ollama' });

    expect(result.content).toBe('respuesta ollama');
    expect(ollama.lastInput?.model).toBe('some-model');
    expect(gemini.lastInput).toBeNull();
  });

  it('fails with LlmRequestFailedError for an unregistered provider', async () => {
    const router = new ProviderRoutingLlmAdapter({ gemini: new RecordingLlm('x') });

    await expect(
      router.generate({ ...BASE_INPUT, provider: 'desconocido' }),
    ).rejects.toBeInstanceOf(LlmRequestFailedError);
  });
});
