import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { env } from '../../../../../infrastructure/config/env';

// Storage local en disco: UPLOADS_DIR/<orgId>/<spaceId>/<documentId>.<ext>.
// El path relativo se persiste en context_documents.file_path.

export function buildDocumentPath(
  organizationId: string,
  spaceId: string,
  documentId: string,
  originalName: string,
): string {
  const ext = path.extname(originalName).toLowerCase().slice(0, 10);
  return path.join(organizationId, spaceId, `${documentId}${ext}`);
}

export async function saveDocumentFile(relativePath: string, buffer: Buffer): Promise<void> {
  const absolute = path.join(env.UPLOADS_DIR, relativePath);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, buffer);
}

export async function readDocumentFile(relativePath: string): Promise<Buffer> {
  return readFile(path.join(env.UPLOADS_DIR, relativePath));
}

export async function deleteDocumentFile(relativePath: string): Promise<void> {
  await rm(path.join(env.UPLOADS_DIR, relativePath), { force: true });
}
