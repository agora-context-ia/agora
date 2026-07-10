import mammoth from 'mammoth';
// Import profundo: el index de pdf-parse v1 trae código de debug que se
// ejecuta al cargar el módulo fuera de CommonJS puro.
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { UnsupportedFileTypeError } from '../domain/document';

// MIME types aceptados y su extractor. La whitelist también la usa multer
// (rechazo temprano con 415 antes de guardar nada).
export const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
] as const;

export function isSupportedMimeType(mimeType: string): boolean {
  return (SUPPORTED_MIME_TYPES as readonly string[]).includes(mimeType);
}

export async function extractText(buffer: Buffer, mimeType: string): Promise<string> {
  switch (mimeType) {
    case 'application/pdf': {
      const result = await pdfParse(buffer);
      return result.text;
    }
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }
    case 'text/plain':
    case 'text/markdown':
    case 'text/csv':
    case 'application/json':
      return buffer.toString('utf-8');
    default:
      throw new UnsupportedFileTypeError(mimeType);
  }
}
