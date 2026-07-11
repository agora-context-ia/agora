// Credenciales de proveedores de IA a nivel organización. La carga un
// owner/admin y la usa todo el equipo. La key cifrada nunca sale por
// HTTP: hacia afuera solo viaja apiKeyLastFour.

export const AI_PROVIDERS = ['gemini'] as const;
export type AiProvider = (typeof AI_PROVIDERS)[number];

export interface AiModelOption {
  value: string;
  label: string;
}

// Catálogo hardcodeado por ahora. Si crece, pasa a una tabla del schema
// parameters. Se usan los alias rodantes -latest de Google (apuntan
// siempre a la última versión estable): los nombres versionados se
// retiran para cuentas nuevas (gemini-2.5-* ya devuelve 404) y romperían
// el chat en cada recambio de generación.
export const AI_PROVIDER_CATALOG: Record<AiProvider, { label: string; models: AiModelOption[] }> = {
  gemini: {
    label: 'Google Gemini',
    models: [
      { value: 'gemini-flash-latest', label: 'Gemini Flash (rápido)' },
      { value: 'gemini-flash-lite-latest', label: 'Gemini Flash Lite (más económico)' },
      { value: 'gemini-pro-latest', label: 'Gemini Pro (más capaz)' },
    ],
  },
};

export function isAiProvider(value: string): value is AiProvider {
  return (AI_PROVIDERS as readonly string[]).includes(value);
}

// Resumen visible hacia afuera: nunca incluye la key (ni cifrada).
export interface ProviderCredentialSummary {
  provider: AiProvider;
  apiKeyLastFour: string;
  updatedAt: Date;
}

// Estado de un proveedor soportado, esté o no configurado. Alimenta
// tanto la sección de Settings como el selector de modelo del chat.
export interface ProviderSetting {
  provider: AiProvider;
  label: string;
  models: AiModelOption[];
  configured: boolean;
  apiKeyLastFour: string | null;
  updatedAt: Date | null;
}

export class NotOrganizationMemberError extends Error {
  constructor() {
    super('No sos miembro de esta organización');
    this.name = 'NotOrganizationMemberError';
  }
}

export class NotOrganizationAdminError extends Error {
  constructor() {
    super('Solo un owner o admin de la organización puede configurar esto');
    this.name = 'NotOrganizationAdminError';
  }
}

export class UnknownAiProviderError extends Error {
  constructor(provider: string) {
    super(`Proveedor de IA desconocido: ${provider}`);
    this.name = 'UnknownAiProviderError';
  }
}

export class InvalidApiKeyError extends Error {
  constructor() {
    super('La API key no parece válida');
    this.name = 'InvalidApiKeyError';
  }
}
