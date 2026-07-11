/** Estados del pipeline real de procesamiento (upload → chunking → embeddings). */
export type SourceStatus = 'pending' | 'processing' | 'ready' | 'error';

/** File kind used to pick the list icon. */
export type SourceFileType = 'pdf' | 'txt' | 'docx' | 'md' | 'csv' | 'json';

/** Classification assigned to a source (from the catalog). */
export interface SourceClassification {
  code: string;
  name: string;
}

/** A document uploaded to a project, with its processing status. */
export interface Source {
  id: string;
  projectId: string;
  fileName: string;
  fileType: SourceFileType;
  status: SourceStatus;
  classification: SourceClassification | null;
  processingError: string | null;
  uploadedAt: string;
}
