import { useEffect, useState } from 'react';
import type { CatalogItemDto } from '@contexthub-ai/shared-types';
import { apiFetch } from '@/lib/api';

// Cache a nivel módulo: el catálogo es estable durante la sesión.
let cachedItems: CatalogItemDto[] | null = null;
let pendingRequest: Promise<CatalogItemDto[]> | null = null;

function fetchClassifications(): Promise<CatalogItemDto[]> {
  if (cachedItems) return Promise.resolve(cachedItems);
  pendingRequest ??= apiFetch<{ items: CatalogItemDto[] }>(
    '/api/catalogs/DOCUMENT_CLASSIFICATION/items',
  ).then((body) => {
    cachedItems = body.items;
    pendingRequest = null;
    return body.items;
  });
  return pendingRequest;
}

/** Ítems del catálogo DOCUMENT_CLASSIFICATION para el select de subida. */
export function useClassifications() {
  const [classifications, setClassifications] = useState<CatalogItemDto[]>(cachedItems ?? []);

  useEffect(() => {
    let cancelled = false;
    fetchClassifications()
      .then((items) => {
        if (!cancelled) setClassifications(items);
      })
      .catch(() => {
        // sin catálogo no se puede clasificar: el select queda vacío y el
        // botón de subir deshabilitado
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { classifications };
}
