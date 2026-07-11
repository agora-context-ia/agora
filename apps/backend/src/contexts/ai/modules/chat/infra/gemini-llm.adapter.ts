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

// Adapter de chat contra la API de Google AI Studio (generateContent).
// Mismo host que el adapter de embeddings; la key llega por request
// porque es la de la organización (descifrada server-side), no una
// global del backend.
export class GeminiLlmAdapter implements LlmProviderPort {
  async generate(input: LlmGenerateInput): Promise<LlmGenerateResult> {
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/` +
      `${input.model}:generateContent`;

    const contents = [
      ...input.history.map((message) => ({
        // Gemini llama 'model' al rol del asistente.
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content }],
      })),
      { role: 'user', parts: [{ text: input.userMessage }] },
    ];

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // La key va en header (no en query string) para que no quede en
        // logs de acceso.
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

// El cuerpo de error de Google es JSON con { error: { message } }; si no
// se puede parsear se devuelve el texto crudo truncado.
function extractErrorMessage(body: string): string {
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string } };
    if (parsed.error?.message) return parsed.error.message.slice(0, 300);
  } catch {
    // no era JSON
  }
  return body.slice(0, 300);
}
