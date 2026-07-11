/**
 * Extracts plain text from uploaded files. Kept behind a port because the
 * implementation depends on parser libraries (pdf-parse, mammoth).
 */
export interface TextExtractionPort {
  /** Whether an extractor exists for the given MIME type. */
  isSupported(mimeType: string): boolean;
  /** @throws UnsupportedFileTypeError when the MIME type has no extractor. */
  extract(buffer: Buffer, mimeType: string): Promise<string>;
}
