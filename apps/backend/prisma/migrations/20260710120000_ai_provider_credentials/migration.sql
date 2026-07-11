-- =====================================================================
-- ContextHub AI — Credenciales de proveedores de IA por organización
-- =====================================================================
-- API keys de proveedores (Gemini por ahora) a nivel organización.
-- La key se guarda cifrada con AES-256-GCM (CREDENTIALS_ENCRYPTION_KEY,
-- variable de entorno del backend, nunca en la DB). A diferencia de
-- security.api_keys (hash irreversible), acá hace falta descifrarla
-- para mandarla en cada llamada al proveedor. El frontend solo recibe
-- api_key_last_four.
-- =====================================================================

CREATE TABLE main.ai_provider_credentials (
  id                UUID PRIMARY KEY DEFAULT uuidv7(),
  organization_id   UUID NOT NULL REFERENCES main.organizations (id),
  provider          VARCHAR(30) NOT NULL,  -- 'gemini' por ahora
  api_key_encrypted TEXT NOT NULL,         -- iv:tag:ciphertext (AES-256-GCM)
  api_key_last_four VARCHAR(4) NOT NULL,
  created_by        UUID NOT NULL REFERENCES security.users (id),
  status            BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ,
  CONSTRAINT uq_ai_provider_credentials UNIQUE (organization_id, provider)
);
CREATE INDEX idx_ai_provider_credentials_organization_id
  ON main.ai_provider_credentials (organization_id);

-- Trigger updated_at (la función public.set_updated_at ya existe del init)
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON main.ai_provider_credentials
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
