import { prisma } from '../../../../../infrastructure/persistence/prisma-client';
import type {
  ClassificationItem,
  ClassificationLookupPort,
} from '../ports/classification-lookup.port';

const DOCUMENT_CLASSIFICATION_CATALOG = 'DOCUMENT_CLASSIFICATION';

/** Looks up DOCUMENT_CLASSIFICATION items in the parameters schema. */
export class PrismaClassificationLookupAdapter implements ClassificationLookupPort {
  async findByCode(code: string): Promise<ClassificationItem | null> {
    const item = await prisma.catalogItem.findFirst({
      where: {
        code,
        status: true,
        deletedAt: null,
        catalog: { code: DOCUMENT_CLASSIFICATION_CATALOG, status: true, deletedAt: null },
      },
      select: { id: true, code: true, name: true },
    });
    return item;
  }
}
