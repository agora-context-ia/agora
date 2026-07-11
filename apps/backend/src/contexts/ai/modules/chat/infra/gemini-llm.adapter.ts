import { LlmRequestFailedError } from '../domain/chat';
import type {
  LlmGenerateInput,
  LlmGenerateResult,
  LlmProviderPort,
} from '../ports/llm-provider.port';

interface GeminiGenerateResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
  };
}

/**
 * Chat adapter for the Google AI Studio API (generateContent). Same host
 * as the embeddings adapter; the key arrives per request because it is
 * the organization's key (decrypted server-side), not a backend global.
 */
export class GeminiLlmAdapter implements LlmProviderPort {
  /** @throws LlmRequestFailedError when Gemini returns an error or an empty candidate. */
  async generate(input: LlmGenerateInput): Promise<LlmGenerateResult> {
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/` +
      `${input.model}:generateContent`;

    const contents = [
      ...input.history.map((message) => ({
        // Gemini calls the assistant role 'model'.
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content }],
      })),
      { role: 'user', parts: [{ text: input.userMessage }] },
    ];

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // The key goes in a header (not the query string) so it never
        // lands in access logs.
        'x-goog-api-key': input.apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: input.systemPrompt }] },
        contents,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new LlmRequestFailedError(
        `Gemini respondió ${response.status}: ${extractErrorMessage(body)}`,
      );
    }

    const data = (await response.json()) as GeminiGenerateResponse;
    const parts = data.candidates?.[0]?.content?.parts ?? [];
    const content = parts.map((part) => part.text ?? '').join('');

    if (!content) {
      const reason = data.candidates?.[0]?.finishReason ?? 'sin candidatos';
      throw new LlmRequestFailedError(`Gemini no devolvió texto (${reason})`);
    }

    return {
      content,
      tokensInput: data.usageMetadata?.promptTokenCount ?? null,
      tokensOutput: data.usageMetadata?.candidatesTokenCount ?? null,
    };
  }
}

/**
 * Google error bodies are JSON shaped as { error: { message } }; when the
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
