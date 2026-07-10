import { describe, expect, it } from 'vitest';
import {
  InvalidClassificationError,
  SpaceNotFoundInOrganizationError,
  UnsupportedFileTypeError,
} from '../../src/contexts/knowledge-management/modules/documents/domain/document';
import { NotOrganizationMemberError } from '../../src/contexts/knowledge-management/modules/projects/domain/space';
import { UploadDocumentUseCase } from '../../src/contexts/knowledge-management/modules/documents/use-cases/upload-document/upload-document.use-case';
import {
  FakeClassificationLookup,
  FakeDocumentRepository,
  FakeFileStorage,
  FakeMembership,
  FakeQueue,
  FakeSpaceAccess,
} from './fakes/fake-document-module';

function buildUseCase(overrides?: { membership?: FakeMembership }) {
  const documents = new FakeDocumentRepository();
  const storage = new FakeFileStorage();
  const queue = new FakeQueue();
  const useCase = new UploadDocumentUseCase(
    documents,
    overrides?.membership ?? new FakeMembership([['user-1', 'org-1']]),
    new FakeSpaceAccess({ 'space-1': 'org-1', 'space-otro': 'org-2' }),
    new FakeClassificationLookup([{ id: 'item-1', code: 'CONTRACT', name: 'Contrato' }]),
    storage,
    queue,
  );
  return { useCase, documents, storage, queue };
}

const validInput = {
  userId: 'user-1',
  organizationId: 'org-1',
  spaceId: 'space-1',
  fileName: 'contrato.txt',
  mimeType: 'text/plain',
  fileSizeBytes: 4,
  classificationCode: 'CONTRACT',
};

describe('UploadDocumentUseCase', () => {
  it('crea el documento, guarda el archivo y encola el procesamiento', async () => {
    const { useCase, storage, queue } = buildUseCase();

    const document = await useCase.execute(validInput, Buffer.from('hola'));

    expect(document.filePath).toBe(`org-1/space-1/${document.id}.txt`);
    expect(storage.saved.has(document.filePath)).toBe(true);
    expect(queue.enqueued).toEqual([document.id]);
    expect(document.processingStatus).toBe('pending');
  });

  it('rechaza con 403 (NotOrganizationMemberError) si el usuario no es miembro', async () => {
    const { useCase, queue } = buildUseCase({ membership: new FakeMembership([]) });

    await expect(useCase.execute(validInput, Buffer.from('x'))).rejects.toBeInstanceOf(
      NotOrganizationMemberError,
    );
    expect(queue.enqueued).toHaveLength(0);
  });

  it('rechaza con 404 si el espacio pertenece a otra organización', async () => {
    const { useCase } = buildUseCase();

    await expect(
      useCase.execute({ ...validInput, spaceId: 'space-otro' }, Buffer.from('x')),
    ).rejects.toBeInstanceOf(SpaceNotFoundInOrganizationError);
  });

  it('rechaza con 415 los MIME types no soportados', async () => {
    const { useCase } = buildUseCase();

    await expect(
      useCase.execute(
        { ...validInput, mimeType: 'application/octet-stream' },
        Buffer.from('x'),
      ),
    ).rejects.toBeInstanceOf(UnsupportedFileTypeError);
  });

  it('rechaza con 400 una clasificación inexistente en el catálogo', async () => {
    const { useCase, documents } = buildUseCase();

    await expect(
      useCase.execute({ ...validInput, classificationCode: 'NOEXISTE' }, Buffer.from('x')),
    ).rejects.toBeInstanceOf(InvalidClassificationError);
    expect(documents.documents).toHaveLength(0);
  });
});
