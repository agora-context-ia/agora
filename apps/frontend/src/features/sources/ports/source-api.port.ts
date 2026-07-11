import type { Source } from '../domain/source';

/**
 * Acceso a las fuentes (documentos) de un proyecto contra el backend real.
 * El estado de procesamiento NO se pollea: llega como evento SSE
 * (document.updated, ver lib/realtime.ts) y la UI refetchea list().
 */
export interface SourceApiPort {
  list(organizationId: string, projectId: string): Promise<Source[]>;

  /** Uploads the file with its classification (DOCUMENT_CLASSIFICATION catalog code). */
  upload(
    organizationId: string,
    projectId: string,
    file: File,
    classificationCode: string,
  ): Promise<Source>;

  remove(organizationId: string, projectId: string, sourceId: string): Promise<void>;

  /** Vuelve a extraer/chunkear/embeber (p. ej. tras un error o cambio de modelo). */
  reprocess(organizationId: string, projectId: string, sourceId: string): Promise<Source>;
}
