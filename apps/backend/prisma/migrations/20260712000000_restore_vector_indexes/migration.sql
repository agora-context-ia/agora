-- Restore the two ai.embeddings indexes that the previous auto-generated
-- `_fix` migration dropped as "drift":
--
--   1. The HNSW vector index used by every semantic search
--      (ORDER BY embedding <=> query). It cannot be expressed in the Prisma
--      DSL, so it is (re)created by hand here and must be kept by hand in
--      future generated migrations (see the comment on model Embedding).
--   2. The (space_id, model_name) filter index. This one IS modeled in the
--      schema (@@index([spaceId, modelName])); the name below matches the
--      convention Prisma would generate so no further drift is produced.

-- HNSW: better recall/latency than IVFFlat for ANN search in pgvector.
CREATE INDEX IF NOT EXISTS idx_embeddings_vector_hnsw
  ON ai.embeddings USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS embeddings_space_id_model_name_idx
  ON ai.embeddings (space_id, model_name);
