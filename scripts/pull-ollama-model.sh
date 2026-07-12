#!/bin/sh
# Ensures the embedding model is present in the Ollama server.
#
# Runs as the `ollama-init` sidecar in docker-compose: it waits (via the
# service healthcheck) until the `ollama` server accepts requests, then
# pulls the model only if it is not already downloaded (idempotent, so a
# warm ollama_models volume is not re-downloaded on every `up`).
#
# OLLAMA_HOST points the CLI at the server container, so the download is
# stored in the server's volume, not this short-lived sidecar.
set -e

MODEL="${EMBEDDING_MODEL:-nomic-embed-text}"

if ollama list | awk '{print $1}' | grep -qx "${MODEL}:latest" \
   || ollama list | awk '{print $1}' | grep -qx "${MODEL}"; then
  echo "Ollama model '${MODEL}' already present. Nothing to pull."
  exit 0
fi

echo "Pulling Ollama model '${MODEL}'..."
ollama pull "${MODEL}"
echo "Ollama model '${MODEL}' is ready."
