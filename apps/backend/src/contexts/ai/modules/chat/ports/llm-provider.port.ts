export interface LlmHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface LlmGenerateInput {
  apiKey: string;
  model: string;
  systemPrompt: string;
  // Historial previo de la conversación (sin el mensaje nuevo).
  history: LlmHistoryMessage[];
  userMessage: string;
}

export interface LlmGenerateResult {
  content: string;
  tokensInput: number | null;
  tokensOutput: number | null;
}

export interface LlmProviderPort {
  generate(input: LlmGenerateInput): Promise<LlmGenerateResult>;
}
