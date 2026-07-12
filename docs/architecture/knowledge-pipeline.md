# Knowledge Pipeline

How a file becomes a grounded answer: ingestion → chunking → embeddings →
retrieval → answer.

```
 upload (HTTP)          background (BullMQ)                     query time
┌────────────┐   ┌──────────────────────────────────┐   ┌─────────────────────┐
│ file + type │──▶│ extract text → chunk → embed →   │   │ embed question →    │
│ (≤ 20 MB)   │   │ store chunks + vectors (pgvector)│   │ ANN search → top-K →│
└────────────┘   └──────────────────────────────────┘   │ prompt LLM → answer │
      │                        │                         │ + citations         │
      ▼                        ▼                         └─────────────────────┘
   SSE: document.updated    SSE: document.updated                 │
   (uploaded)               (processed / error)                   ▼
                                                        SSE: conversation.updated
```

## 1. Ingestion

- Upload endpoint accepts **PDF, DOCX, TXT, MD, CSV, JSON** up to
  **20 MB**, plus a classification from the `parameters` catalog
  (e.g. *Contract*, *Policy / regulation*).
- The file is stored on disk (`UPLOADS_DIR`), a `context_source` +
  `context_document` pair is created, and a processing job is enqueued in
  **BullMQ** (Redis). The HTTP request returns immediately.
- Processing state is visible in the UI (pending → processed / error) via
  `document.updated` SSE events; failed documents can be **reprocessed**
  from the UI.

## 2. Text extraction & chunking

- Text is extracted per format (`pdf-parse` for PDF, `mammoth` for DOCX,
  plain read for text formats).
- The text is split into **chunks** (`main.context_chunks`) with their
  token counts. Chunks and embeddings are *derived data*: on reprocess or
  delete they are **hard-deleted** and rebuilt (soft delete is reserved
  for business entities).

## 3. Embeddings

- Each chunk is embedded via the configured **embedding provider**:
  - `ollama` (default): `nomic-embed-text`, fully local and free.
  - `gemini`: Google's embedding API.
- Embedding is **purpose-aware**: chunks are embedded as *documents* and
  questions as *queries* (nomic `search_document:`/`search_query:`
  prefixes; Gemini `taskType`), as retrieval-tuned models require.
- Vectors are **768-dimensional** (compatible with both providers) and
  stored in `ai.embeddings` (pgvector), tagged with the `model_name` that
  produced them so mixed-model spaces never cross-contaminate search.
- Inserts happen in batches inside a transaction, replacing the source's
  previous derived data atomically.

## 4. Retrieval (query time)

- The user's question is embedded with the same provider/model (as a
  *query*, see above).
- An **ANN search** runs in pgvector using cosine distance over an
  **HNSW index**, scoped to the project (space) and the embedding model,
  returning the top **8** chunks with scores.
- Chunks scoring below the **relevance floor** (`MIN_RELEVANCE`, cosine
  similarity 0.58 — calibrated on nomic-embed-text with task prefixes)
  are dropped: an empty context — which the prompt states explicitly —
  beats injecting unrelated fragments and presenting them as sources.
- Results are **deduplicated per document** (the best fragment per
  document survives) before being shown as citations.
- If retrieval is unavailable (e.g. Ollama down in local dev), the chat
  degrades gracefully: it continues without context instead of failing.

## 5. Answer generation

- The retrieved fragments are injected into a **mode-specific system
  prompt** (general, explain-process, design-requirement, summary,
  explain-rules, detect-contradictions, acceptance-criteria).
- The last **12** messages of the conversation are sent as history.
- The LLM behind the chosen model (Gemini, OpenAI, Anthropic or local
  Ollama; see [ai-providers.md](ai-providers.md)) generates the reply.
- Both the user message and the assistant reply are persisted — the reply
  **together with its sources** (see
  [traceability-and-citations.md](traceability-and-citations.md)).
- The user message is persisted only after the LLM call succeeds, so a
  failed call never leaves an unanswered question in the thread.
- A `conversation.updated` SSE event notifies the owner's other sessions.

## Tuning constants (current defaults)

| Constant | Value | Where |
|---|---|---|
| Context chunks retrieved | 8 | `send-chat-message.use-case.ts` |
| Relevance floor (cosine) | 0.58 | `embedding-context-search.adapter.ts` |
| History messages sent | 12 | `send-chat-message.use-case.ts` |
| Source fragment preview | 300 chars | `send-chat-message.use-case.ts` |
| Embedding dimensions | 768 | `EMBEDDING_DIM` env |
| Max upload size | 20 MB | upload route |
