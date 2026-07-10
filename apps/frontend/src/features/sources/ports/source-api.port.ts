import type { Source } from '../domain/source';

/**
 * Acceso a las fuentes (documentos) de un proyecto contra el backend real.
 * El estado de procesamiento NO se pollea: llega como evento SSE
 * (document.updated, ver lib/realtime.ts) y la UI refetchea list().
 */
export interface SourceApiPort {
  list(organizationId: string, projectId: string): Promise<Source[]>;

  /** Sube el archivo con su clasificación (code del catálogo DOCUMENT_CLASSIFICATION). */
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
