/** One prior conversation turn sent to the LLM as history. */
export interface LlmHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** Everything an LLM call needs; `history` excludes the new user message. */
export interface LlmGenerateInput {
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
