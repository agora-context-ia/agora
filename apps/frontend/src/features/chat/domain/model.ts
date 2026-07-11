/**
 * AI model chosen for the chat (provider + concrete model), distinct
 * from the "mode" (task type, see mode.ts). Options come from what the
 * active organization configured in Settings > AI Models.
 */
export interface ChatModelOption {
  value: string; // e.g. 'gemini-flash-latest'
  label: string;
  providerLabel: string; // ej. 'Google Gemini'
}
