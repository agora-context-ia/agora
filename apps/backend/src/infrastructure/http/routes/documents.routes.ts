import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import {
  DocumentNotFoundError,
  InvalidClassificationError,
  SpaceNotFoundInOrganizationError,
  UnsupportedFileTypeError,
  type ContextDocumentEntity,
} from '../../../contexts/knowledge-management/modules/documents/domain/document';
import { NotOrganizationMemberError } from '../../../contexts/knowledge-management/modules/projects/domain/space';
import { container } from '../../container';
import { requireAuth } from '../require-auth';

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

// memoryStorage: the file goes through the use case (which decides the
// path and persists it); multer enforces the size limit first.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

// Montado en /api/organizations/:orgId/spaces/:spaceId/documents
export const documentsRouter: Router = Router({ mergeParams: true });

documentsRouter.use(requireAuth);

documentsRouter.get('/', async (req: Request, res: Response) => {
  const { orgId, spaceId } = req.params as { orgId: string; spaceId: string };
  try {
    const documents = await container.listDocuments.execute(req.userId!, orgId, spaceId);
    return res.json({ documents: documents.map(toDocumentDto) });
  } catch (error) {
    return handleDocumentError(error, res);
  }
});

documentsRouter.post('/', (req: Request, res: Response) => {
  upload.single('file')(req, res, async (uploadError: unknown) => {
    if (uploadError instanceof multer.MulterError && uploadError.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'El archivo supera el máximo de 20 MB' });
    }
    if (uploadError) {
      return res.status(400).json({ error: 'No se pudo leer el archivo' });
    }

    const { orgId, spaceId } = req.params as { orgId: string; spaceId: string };
    const file = req.file;
    const { classificationCode } = (req.body ?? {}) as Record<string, unknown>;

    if (!file) {
      return res.status(400).json({ error: 'Falta el archivo (campo "file")' });
    }
    if (typeof classificationCode !== 'string' || classificationCode.trim().length === 0) {
      return res.status(400).json({ error: 'Falta la clasificación del documento' });
    }

    try {
      const document = await container.uploadDocument.execute(
        {
          userId: req.userId!,
          organizationId: orgId,
          spaceId,
          // multer decodes the name as latin1: restore UTF-8 (accents).
          fileName: Buffer.from(file.originalname, 'latin1').toString('utf-8'),
          mimeType: file.mimetype,
          fileSizeBytes: file.size,
          classificationCode: classificationCode.trim(),
        },
        file.buffer,
      );
      return res.status(201).json({ document: toDocumentDto(document) });
    } catch (error) {
      return handleDocumentError(error, res);
    }
  });
});

documentsRouter.delete('/:documentId', async (req: Request, res: Response) => {
  const { orgId, spaceId, documentId } = req.params as {
    orgId: string;
    spaceId: string;
    documentId: string;
  };
  try {
    await container.deleteDocument.execute(req.userId!, orgId, spaceId, documentId);
    return res.status(204).end();
  } catch (error) {
    return handleDocumentError(error, res);
  }
});

documentsRouter.post('/:documentId/reprocess', async (req: Request, res: Response) => {
  const { orgId, spaceId, documentId } = req.params as {
    orgId: string;
    spaceId: string;
    documentId: string;
  };
  try {
    const document = await container.reprocessDocument.execute(
      req.userId!,
      orgId,
      spaceId,
      documentId,
    );
    return res.status(202).json({ document: toDocumentDto(document) });
  } catch (error) {
    return handleDocumentError(error, res);
  }
});

function handleDocumentError(error: unknown, res: Response): Response {
  if (error instanceof NotOrganizationMemberError) {
    return res.status(403).json({ error: error.message });
  }
  if (
    error instanceof SpaceNotFoundInOrganizationError ||
    error instanceof DocumentNotFoundError
  ) {
    return res.status(404).json({ error: error.message });
  }
  if (error instanceof UnsupportedFileTypeError) {
    return res.status(415).json({ error: error.message });
  }
  if (error instanceof InvalidClassificationError) {
    return res.status(400).json({ error: error.message });
  }
  throw error;
}

function toDocumentDto(document: ContextDocumentEntity) {
  return {
    id: document.id,
    spaceId: document.spaceId,
    fileName: document.fileName,
    mimeType: document.mimeType,
    fileSizeBytes: document.fileSizeBytes,
    processingStatus: document.processingStatus,
    processingError: document.processingError,
    classification: document.classification,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
  };
}
