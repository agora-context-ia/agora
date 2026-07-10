/** Estados del pipeline real de procesamiento (upload → chunking → embeddings). */
export type SourceStatus = 'pending' | 'processing' | 'ready' | 'error';

export type SourceFileType = 'pdf' | 'txt' | 'docx' | 'md' | 'csv' | 'json';

export interface SourceClassification {
  code: string;
  name: string;
}

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
