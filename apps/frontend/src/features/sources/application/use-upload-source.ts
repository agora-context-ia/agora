import { useCallback, useState } from 'react';
import { ApiError } from '@/lib/api';
import { sourceApiAdapter } from '../infra/http-source-api.adapter';
import { useSourceStore } from './use-sources';

/**
 * Sube un archivo con su clasificación. El documento entra en pending y su
 * avance (processing → ready | error) llega por SSE, que refetchea la lista.
 */
export function useUploadSource(organizationId: string | null, projectId: string | null) {
  const upsertSource = useSourceStore((state) => state.upsertSource);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadSource = useCallback(
    async (file: File, classificationCode: string) => {
      if (!organizationId || !projectId) return;

      setIsUploading(true);
      setError(null);
      try {
        const source = await sourceApiAdapter.upload(
          organizationId,
          projectId,
          file,
          classificationCode,
        );
        upsertSource(projectId, source);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'No se pudo conectar con el servidor');
      } finally {
        setIsUploading(false);
      }
    },
    [organizationId, projectId, upsertSource],
  );

  return { uploadSource, isUploading, error };
}
