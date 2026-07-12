import { LlmRequestFailedError } from '../domain/chat';
import type {
  LlmGenerateInput,
  LlmGenerateResult,
  LlmProviderPort,
} from '../ports/llm-provider.port';

interface OllamaChatResponse {
  message?: { content?: string };
  prompt_eval_count?: number;
  eval_count?: number;
}

/**
 * Chat adapter for a local Ollama server (/api/chat). Keyless: the server
 * is part of the self-hosted infrastructure, so `apiKey` is ignored. This
 * is the adapter that makes fully-local, zero-cost operation possible.
 */
export class OllamaLlmAdapter implements LlmProviderPort {
  constructor(private readonly baseUrl: string) {}

  /** @throws LlmRequestFailedError when Ollama returns an error or empty text. */
  async generate(input: LlmGenerateInput): Promise<LlmGenerateResult> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: input.model,
        stream: false,
        messages: [
          { role: 'system', content: input.systemPrompt },
          ...input.history.map((message) => ({
            role: message.role,
            content: message.content,
          })),
          { role: 'user', content: input.userMessage },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new LlmRequestFailedError(
        `Ollama respondió ${response.status}: ${extractErrorMessage(body)}`,
      );
    }

    const data = (await response.json()) as OllamaChatResponse;
    const content = data.message?.content ?? '';

    if (!content) {
      throw new LlmRequestFailedError('Ollama no devolvió texto');
    }

    return {
      content,
      tokensInput: data.prompt_eval_count ?? null,
      tokensOutput: data.eval_count ?? null,
    };
  }
}

/**
 * Ollama error bodies are JSON shaped as { error }; when the body is not
 * parseable the raw text is returned truncated.
 */
function extractErrorMessage(body: string): string {
  try {
    const parsed = JSON.parse(body) as { error?: string };
    if (parsed.error) return parsed.error.slice(0, 300);
  } catch {
    // not JSON
  }
  return body.slice(0, 300);
}
