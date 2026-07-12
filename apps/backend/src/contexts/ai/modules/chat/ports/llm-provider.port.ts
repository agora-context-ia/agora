/** One prior conversation turn sent to the LLM as history. */
export interface LlmHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Everything an LLM call needs; `history` excludes the new user message.
 * `provider` is the catalog id the model belongs to (routing key);
 * `apiKey` is empty for keyless providers (e.g. local Ollama).
 */
export interface LlmGenerateInput {
  provider: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
  history: LlmHistoryMessage[];
  userMessage: string;
}

/** LLM reply plus token usage when the provider reports it. */
export interface LlmGenerateResult {
  content: string;
  tokensInput: number | null;
  tokensOutput: number | null;
}

/** Provider-agnostic contract for a single chat completion call. */
export interface LlmProviderPort {
  generate(input: LlmGenerateInput): Promise<LlmGenerateResult>;
}
