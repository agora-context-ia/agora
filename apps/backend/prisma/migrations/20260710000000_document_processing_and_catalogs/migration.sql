-- =====================================================================
-- ContextHub AI — Procesamiento de documentos + esquema parameters
-- =====================================================================
-- 1) Estado de procesamiento del pipeline upload -> chunking -> embedding
--    en main.context_documents.
-- 2) Índice (space_id, model_name) en ai.embeddings: la búsqueda semántica
--    SIEMPRE filtra por modelo activo (vectores de modelos distintos no
--    se mezclan). El índice HNSW ya existe desde la migración init.
-- 3) Schema `parameters`: catálogos genéricos (cabecera + ítems) con
--    `code` estable como contrato con el código de aplicación. Primer
--    catálogo: DOCUMENT_CLASSIFICATION (clasificación de cada archivo).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Estado de procesamiento en context_documents
-- ---------------------------------------------------------------------
CREATE TYPE main.document_processing_status AS ENUM
  ('pending', 'processing', 'ready', 'error');

ALTER TABLE main.context_documents
  ADD COLUMN processing_status main.document_processing_status NOT NULL DEFAULT 'pending',
  ADD COLUMN processing_error  TEXT;

-- ---------------------------------------------------------------------
-- 2. Índice para el filtro de búsqueda por espacio + modelo
-- ---------------------------------------------------------------------
CREATE INDEX idx_embeddings_space_id_model_name
  ON ai.embeddings (space_id, model_name);

-- ---------------------------------------------------------------------
-- 3. Schema parameters: catálogos
-- ---------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS parameters;

-- Cabecera de catálogo (ej: DOCUMENT_CLASSIFICATION; futuros: idiomas, etc.)
CREATE TABLE parameters.catalogs (
  id          UUID PRIMARY KEY DEFAULT uuidv7(),
  code        VARCHAR(60) NOT NULL,   -- estable, MAYUS_SNAKE; contrato con el código
  name        VARCHAR(120) NOT NULL,  -- editable para UI
  description TEXT,
  status      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);
CREATE UNIQUE INDEX uq_catalogs_code
  ON parameters.catalogs (code) WHERE deleted_at IS NULL;

-- Ítems del catálogo (las clasificaciones concretas)
CREATE TABLE parameters.catalog_items (
  id          UUID PRIMARY KEY DEFAULT uuidv7(),
  catalog_id  UUID NOT NULL REFERENCES parameters.catalogs (id),
  code        VARCHAR(60) NOT NULL,   -- único dentro del catálogo
  name        VARCHAR(120) NOT NULL,
  description TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  status      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);
CREATE UNIQUE INDEX uq_catalog_items_catalog_id_code
  ON parameters.catalog_items (catalog_id, code) WHERE deleted_at IS NULL;
CREATE INDEX idx_catalog_items_catalog_id ON parameters.catalog_items (catalog_id);

-- Triggers updated_at (la función public.set_updated_at ya existe del init)
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON parameters.catalogs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON parameters.catalog_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------
-- 4. Clasificación de cada documento (FK al catálogo)
-- ---------------------------------------------------------------------
ALTER TABLE main.context_documents
  ADD COLUMN classification_id UUID REFERENCES parameters.catalog_items (id);
CREATE INDEX idx_context_documents_classification_id
  ON main.context_documents (classification_id);

-- ---------------------------------------------------------------------
-- 5. Seed: catálogo DOCUMENT_CLASSIFICATION
-- ---------------------------------------------------------------------
WITH cat AS (
  INSERT INTO parameters.catalogs (code, name, description)
  VALUES (
    'DOCUMENT_CLASSIFICATION',
    'Clasificación de documentos',
    'Tipos de documento que se pueden cargar en un espacio'
  )
  RETURNING id
)
INSERT INTO parameters.catalog_items (catalog_id, code, name, sort_order)
SELECT cat.id, v.code, v.name, v.sort_order
FROM cat,
  (VALUES
    ('CONTRACT',      'Contrato',                  1),
    ('INVOICE',       'Factura',                   2),
    ('REPORT',        'Informe',                   3),
    ('MANUAL',        'Manual / documentación',    4),
    ('POLICY',        'Política / normativa',      5),
    ('PRESENTATION',  'Presentación',              6),
    ('MEETING_NOTES', 'Minuta / notas de reunión', 7),
    ('OTHER',         'Otro',                      8)
  ) AS v(code, name, sort_order);
