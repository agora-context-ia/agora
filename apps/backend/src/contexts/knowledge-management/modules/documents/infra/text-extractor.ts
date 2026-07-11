import mammoth from 'mammoth';
// Deep import: pdf-parse v1's index ships debug code that runs on module
// load outside pure CommonJS.
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { UnsupportedFileTypeError } from '../domain/document';
import type { TextExtractionPort } from '../ports/text-extraction.port';

/**
 * Accepted MIME types. The whitelist is also used by multer for early
 * rejection with 415 before anything is stored.
 */
export const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
] as const;

/** Whether an extractor exists for the given MIME type. */
export function isSupportedMimeType(mimeType: string): boolean {
  return (SUPPORTED_MIME_TYPES as readonly string[]).includes(mimeType);
}

/** {@link TextExtractionPort} adapter backed by pdf-parse, mammoth and utf-8 decoding. */
export const fileTextExtractor: TextExtractionPort = {
  isSupported: isSupportedMimeType,
  extract: extractText,
};

/**
 * Extracts plain text from an uploaded file.
 * @throws UnsupportedFileTypeError when the MIME type has no extractor.
 */
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
