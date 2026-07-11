// Modelo de IA elegido para el chat (proveedor + modelo concreto),
// distinto del "modo" (tipo de tarea, ver mode.ts). Las opciones salen
// de lo configurado por la organización activa en Settings > Modelos IA.
export interface ChatModelOption {
  value: string; // ej. 'gemini-2.5-flash'
  label: string;
  providerLabel: string; // ej. 'Google Gemini'
}
