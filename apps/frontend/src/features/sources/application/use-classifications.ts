import { useEffect, useState } from 'react';
import type { CatalogItemDto } from '@contexthub-ai/shared-types';
import { apiFetch } from '@/lib/api';

// Module-level cache: the catalog is stable for the session.
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

/** DOCUMENT_CLASSIFICATION catalog items for the upload select. */
export function useClassifications() {
  const [classifications, setClassifications] = useState<CatalogItemDto[]>(cachedItems ?? []);

  useEffect(() => {
    let cancelled = false;
    fetchClassifications()
      .then((items) => {
        if (!cancelled) setClassifications(items);
      })
      .catch(() => {
        // without the catalog nothing can be classified: the select stays
        // empty and the upload button disabled
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { classifications };
}
