// Configuración de IA de la organización activa, vista desde el frontend.
// La API key nunca llega completa: solo apiKeyLastFour.

export interface AiModelOption {
  value: string;
  label: string;
}

export interface AiProviderSetting {
  provider: string;
  label: string;
  models: AiModelOption[];
  configured: boolean;
  apiKeyLastFour: string | null;
  updatedAt: string | null;
}
