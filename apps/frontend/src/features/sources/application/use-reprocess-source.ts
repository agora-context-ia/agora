import { useCallback, useState } from 'react';
import { sourceApiAdapter } from '../infra/http-source-api.adapter';
import { useSourceStore } from './use-sources';

export function useReprocessSource(organizationId: string | null, projectId: string | null) {
  const upsertSource = useSourceStore((state) => state.upsertSource);
  const [reprocessingId, setReprocessingId] = useState<string | null>(null);

  const reprocessSource = useCallback(
    async (sourceId: string) => {
      if (!organizationId || !projectId) return;

      setReprocessingId(sourceId);
      try {
        const source = await sourceApiAdapter.reprocess(organizationId, projectId, sourceId);
        upsertSource(projectId, source);
      } finally {
        setReprocessingId(null);
      }
    },
    [organizationId, projectId, upsertSource],
  );

  return { reprocessSource, reprocessingId };
}
