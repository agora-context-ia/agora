import { NotOrganizationMemberError } from '../../../projects/domain/space';
import type { OrganizationMembershipPort } from '../../../projects/ports/organization-membership.port';
import {
  InvalidClassificationError,
  SpaceNotFoundInOrganizationError,
  UnsupportedFileTypeError,
  type ContextDocumentEntity,
} from '../../domain/document';
import type { ClassificationLookupPort } from '../../ports/classification-lookup.port';
import type { DocumentProcessingQueuePort } from '../../ports/document-processing-queue.port';
import type { DocumentRepositoryPort } from '../../ports/document-repository.port';
import type { SpaceAccessPort } from '../../ports/space-access.port';
import type { TextExtractionPort } from '../../ports/text-extraction.port';

/** Upload metadata; the file content arrives separately as a Buffer. */
export interface UploadDocumentInput {
  userId: string;
  organizationId: string;
  spaceId: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  classificationCode: string;
}

/** Stores uploaded files and derives their storage path. */
export interface FileStoragePort {
  buildPath(organizationId: string, spaceId: string, documentId: string, fileName: string): string;
  save(relativePath: string, buffer: Buffer): Promise<void>;
}

/**
 * Registers an uploaded document: validates access and file type, persists
 * the file and the pending document row, then enqueues async processing.
 */
export class UploadDocumentUseCase {
  constructor(
    private readonly documents: DocumentRepositoryPort,
    private readonly membership: OrganizationMembershipPort,
    private readonly spaceAccess: SpaceAccessPort,
    private readonly classifications: ClassificationLookupPort,
    private readonly textExtraction: TextExtractionPort,
    private readonly storage: FileStoragePort,
    private readonly queue: DocumentProcessingQueuePort,
  ) {}

  async execute(input: UploadDocumentInput, buffer: Buffer): Promise<ContextDocumentEntity> {
    const isMember = await this.membership.isMember(input.userId, input.organizationId);
    if (!isMember) throw new NotOrganizationMemberError();

    const spaceOrganization = await this.spaceAccess.findSpaceOrganization(input.spaceId);
    if (spaceOrganization !== input.organizationId) {
      throw new SpaceNotFoundInOrganizationError();
    }

    if (!this.textExtraction.isSupported(input.mimeType)) {
      throw new UnsupportedFileTypeError(input.mimeType);
    }

    const classification = await this.classifications.findByCode(input.classificationCode);
    if (!classification) throw new InvalidClassificationError(input.classificationCode);

    const document = await this.documents.createWithSource({
      spaceId: input.spaceId,
      fileName: input.fileName,
      mimeType: input.mimeType,
      fileSizeBytes: input.fileSizeBytes,
      classificationId: classification.id,
    });

    const filePath = this.storage.buildPath(
      input.organizationId,
      input.spaceId,
      document.id,
      input.fileName,
    );
    await this.storage.save(filePath, buffer);
    await this.documents.updateFilePath(document.id, filePath);

    await this.queue.enqueue(document.id);

    return { ...document, filePath };
  }
}
