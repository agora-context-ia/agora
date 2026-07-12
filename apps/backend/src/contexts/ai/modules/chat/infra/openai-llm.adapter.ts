import { LlmRequestFailedError } from '../domain/chat';
import type {
  LlmGenerateInput,
  LlmGenerateResult,
  LlmProviderPort,
} from '../ports/llm-provider.port';

interface OpenAiChatCompletionResponse {
  choices?: Array<{
    message?: { content?: string | null };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
  };
}

/**
 * Chat adapter for the OpenAI Chat Completions API. The key arrives per
 * request because it is the organization's key (decrypted server-side),
 * not a backend global.
 */
export class OpenAiLlmAdapter implements LlmProviderPort {
  /** @throws LlmRequestFailedError when OpenAI returns an error or an empty choice. */
  async generate(input: LlmGenerateInput): Promise<LlmGenerateResult> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${input.apiKey}`,
      },
      body: JSON.stringify({
        model: input.model,
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
        `OpenAI respondió ${response.status}: ${extractErrorMessage(body)}`,
      );
    }

    const data = (await response.json()) as OpenAiChatCompletionResponse;
    const content = data.choices?.[0]?.message?.content ?? '';

    if (!content) {
      const reason = data.choices?.[0]?.finish_reason ?? 'sin choices';
      throw new LlmRequestFailedError(`OpenAI no devolvió texto (${reason})`);
    }

    return {
      content,
      tokensInput: data.usage?.prompt_tokens ?? null,
      tokensOutput: data.usage?.completion_tokens ?? null,
    };
  }
}

/**
 * OpenAI error bodies are JSON shaped as { error: { message } }; when the
 * body is not parseable the raw text is returned truncated.
 */
function extractErrorMessage(body: string): string {
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string } };
    if (parsed.error?.message) return parsed.error.message.slice(0, 300);
  } catch {
    // not JSON
  }
  return body.slice(0, 300);
}
