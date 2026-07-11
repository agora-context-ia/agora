import { useCallback, useState } from 'react';
import { sourceApiAdapter } from '../infra/http-source-api.adapter';
import { useSourceStore } from './use-sources';

/** Deletes a source and removes it from the store. */
export function useDeleteSource(organizationId: string | null, projectId: string | null) {
  const removeSource = useSourceStore((state) => state.removeSource);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const deleteSource = useCallback(
    async (sourceId: string) => {
      if (!organizationId || !projectId) return;

      setDeletingId(sourceId);
      try {
        await sourceApiAdapter.remove(organizationId, projectId, sourceId);
        removeSource(projectId, sourceId);
      } finally {
        setDeletingId(null);
      }
    },
    [organizationId, projectId, removeSource],
  );

  return { deleteSource, deletingId };
}
