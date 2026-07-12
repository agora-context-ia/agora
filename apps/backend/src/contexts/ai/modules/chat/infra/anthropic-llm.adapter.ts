import { LlmRequestFailedError } from '../domain/chat';
import type {
  LlmGenerateInput,
  LlmGenerateResult,
  LlmProviderPort,
} from '../ports/llm-provider.port';

interface AnthropicMessagesResponse {
  content?: Array<{ type?: string; text?: string }>;
  stop_reason?: string;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
}

// The Messages API requires max_tokens; generous ceiling for long answers.
const MAX_TOKENS = 8192;

/**
 * Chat adapter for the Anthropic Messages API. The key arrives per request
 * because it is the organization's key (decrypted server-side), not a
 * backend global.
 */
export class AnthropicLlmAdapter implements LlmProviderPort {
  /** @throws LlmRequestFailedError when Anthropic returns an error, a refusal or empty text. */
  async generate(input: LlmGenerateInput): Promise<LlmGenerateResult> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': input.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: input.model,
        max_tokens: MAX_TOKENS,
        system: input.systemPrompt,
        messages: [
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
        `Anthropic respondió ${response.status}: ${extractErrorMessage(body)}`,
      );
    }

    const data = (await response.json()) as AnthropicMessagesResponse;

    // A refusal arrives as HTTP 200 with empty/partial content.
    if (data.stop_reason === 'refusal') {
      throw new LlmRequestFailedError('Anthropic rechazó la solicitud (refusal)');
    }

    const content = (data.content ?? [])
      .filter((block) => block.type === 'text')
      .map((block) => block.text ?? '')
      .join('');

    if (!content) {
      const reason = data.stop_reason ?? 'sin contenido';
      throw new LlmRequestFailedError(`Anthropic no devolvió texto (${reason})`);
    }

    return {
      content,
      tokensInput: data.usage?.input_tokens ?? null,
      tokensOutput: data.usage?.output_tokens ?? null,
    };
  }
}

/**
 * Anthropic error bodies are JSON shaped as { error: { message } }; when
 * the body is not parseable the raw text is returned truncated.
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
