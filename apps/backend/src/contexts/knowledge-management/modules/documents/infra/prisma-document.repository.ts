import { prisma } from '../../../../../infrastructure/persistence/prisma-client';
import type { ContextDocumentEntity, DocumentProcessingStatus } from '../domain/document';
import type {
  CreateDocumentData,
  DocumentRepositoryPort,
} from '../ports/document-repository.port';

type DocumentRow = {
  id: string;
  sourceId: string;
  spaceId: string;
  fileName: string;
  filePath: string;
  mimeType: string | null;
  fileSizeBytes: bigint | null;
  processingStatus: DocumentProcessingStatus;
  processingError: string | null;
  createdAt: Date;
  updatedAt: Date;
  classification: { code: string; name: string } | null;
};

const withClassification = {
  classification: { select: { code: true, name: true } },
} as const;

export class PrismaDocumentRepository implements DocumentRepositoryPort {
  async createWithSource(data: CreateDocumentData): Promise<ContextDocumentEntity> {
    const document = await prisma.$transaction(async (tx) => {
      const source = await tx.contextSource.create({
        data: { spaceId: data.spaceId, sourceType: 'file', title: data.fileName },
      });
      return tx.contextDocument.create({
        data: {
          sourceId: source.id,
          spaceId: data.spaceId,
          fileName: data.fileName,
          filePath: '', // se conoce recién con el id: se setea en updateFilePath
          mimeType: data.mimeType,
          fileSizeBytes: BigInt(data.fileSizeBytes),
          classificationId: data.classificationId,
        },
        include: withClassification,
      });
    });
    return toEntity(document);
  }

  async updateFilePath(documentId: string, filePath: string): Promise<void> {
    await prisma.contextDocument.update({ where: { id: documentId }, data: { filePath } });
  }

  async listBySpace(spaceId: string): Promise<ContextDocumentEntity[]> {
    const documents = await prisma.contextDocument.findMany({
      where: { spaceId, deletedAt: null },
      include: withClassification,
      orderBy: { createdAt: 'desc' },
    });
    return documents.map(toEntity);
  }

  async findById(documentId: string): Promise<ContextDocumentEntity | null> {
    const document = await prisma.contextDocument.findFirst({
      where: { id: documentId, deletedAt: null },
      include: withClassification,
    });
    return document ? toEntity(document) : null;
  }

  async setProcessingStatus(
    documentId: string,
    processingStatus: DocumentProcessingStatus,
    processingError: string | null = null,
  ): Promise<void> {
    await prisma.contextDocument.update({
      where: { id: documentId },
      data: { processingStatus, processingError },
    });
  }

  async softDelete(documentId: string): Promise<void> {
    const now = new Date();
    await prisma.$transaction(async (tx) => {
      const document = await tx.contextDocument.update({
        where: { id: documentId },
        data: { deletedAt: now, status: false },
        select: { sourceId: true },
      });
      await tx.contextSource.update({
        where: { id: document.sourceId },
        data: { deletedAt: now, status: false },
      });
    });
  }
}

function toEntity(row: DocumentRow): ContextDocumentEntity {
  return {
    id: row.id,
    sourceId: row.sourceId,
    spaceId: row.spaceId,
    fileName: row.fileName,
    filePath: row.filePath,
    mimeType: row.mimeType,
    fileSizeBytes: row.fileSizeBytes === null ? null : Number(row.fileSizeBytes),
    processingStatus: row.processingStatus,
    processingError: row.processingError,
    classification: row.classification,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
