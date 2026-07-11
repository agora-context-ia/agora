import { useCallback, useState } from 'react';
import { ApiError } from '@/lib/api';
import { sourceApiAdapter } from '../infra/http-source-api.adapter';
import { useSourceStore } from './use-sources';

/**
 * Uploads a file with its classification. The document starts as pending
 * and its progress (processing → ready | error) arrives over SSE, which
 * refetches the list.
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
