import type { DocumentDto } from '@contexthub-ai/shared-types';
import { apiFetch } from '@/lib/api';
import type { Source, SourceFileType } from '../domain/source';
import type { SourceApiPort } from '../ports/source-api.port';

function inferFileType(fileName: string): SourceFileType {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'pdf':
    case 'docx':
    case 'md':
    case 'csv':
    case 'json':
      return extension;
    default:
      return 'txt';
  }
}

function toSource(dto: DocumentDto): Source {
  return {
    id: dto.id,
    projectId: dto.spaceId,
    fileName: dto.fileName,
    fileType: inferFileType(dto.fileName),
    status: dto.processingStatus,
    classification: dto.classification,
    processingError: dto.processingError,
    uploadedAt: dto.createdAt,
  };
}

function basePath(organizationId: string, projectId: string): string {
  return `/api/organizations/${organizationId}/spaces/${projectId}/documents`;
}

class HttpSourceApiAdapter implements SourceApiPort {
  async list(organizationId: string, projectId: string): Promise<Source[]> {
    const body = await apiFetch<{ documents: DocumentDto[] }>(basePath(organizationId, projectId));
    return body.documents.map(toSource);
  }

  async upload(
    organizationId: string,
    projectId: string,
    file: File,
    classificationCode: string,
  ): Promise<Source> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('classificationCode', classificationCode);

    const body = await apiFetch<{ document: DocumentDto }>(basePath(organizationId, projectId), {
      method: 'POST',
      body: formData,
    });
    return toSource(body.document);
  }

  async remove(organizationId: string, projectId: string, sourceId: string): Promise<void> {
    await apiFetch<void>(`${basePath(organizationId, projectId)}/${sourceId}`, {
      method: 'DELETE',
    });
  }

  async reprocess(organizationId: string, projectId: string, sourceId: string): Promise<Source> {
    const body = await apiFetch<{ document: DocumentDto }>(
      `${basePath(organizationId, projectId)}/${sourceId}/reprocess`,
      { method: 'POST' },
    );
    return toSource(body.document);
  }
}

/** HTTP implementation of the source API port. */
export const sourceApiAdapter = new HttpSourceApiAdapter();
