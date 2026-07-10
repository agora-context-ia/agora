// Wiring manual de dependencias (composition root). Si el grafo crece,
// migrar a awilix o similar.
import { BcryptPasswordHasher } from '../contexts/identity/modules/auth/infra/bcrypt-password-hasher';
import { PrismaSessionRepository } from '../contexts/identity/modules/auth/infra/prisma-session.repository';
import { PrismaUserRepository } from '../contexts/identity/modules/auth/infra/prisma-user.repository';
import { GetCurrentUserUseCase } from '../contexts/identity/modules/auth/use-cases/get-current-user/get-current-user.use-case';
import { LoginUserUseCase } from '../contexts/identity/modules/auth/use-cases/login-user/login-user.use-case';
import { LogoutUserUseCase } from '../contexts/identity/modules/auth/use-cases/logout-user/logout-user.use-case';
import { RegisterUserUseCase } from '../contexts/identity/modules/auth/use-cases/register-user/register-user.use-case';
import { PrismaOrganizationRepository } from '../contexts/identity/modules/organizations/infra/prisma-organization.repository';
import { CreateOrganizationUseCase } from '../contexts/identity/modules/organizations/use-cases/create-organization/create-organization.use-case';
import { ListMyOrganizationsUseCase } from '../contexts/identity/modules/organizations/use-cases/list-my-organizations/list-my-organizations.use-case';
import { GeminiEmbeddingAdapter } from '../contexts/knowledge-management/modules/documents/infra/gemini-embedding.adapter';
import { OllamaEmbeddingAdapter } from '../contexts/knowledge-management/modules/documents/infra/ollama-embedding.adapter';
import {
  buildDocumentPath,
  deleteDocumentFile,
  readDocumentFile,
  saveDocumentFile,
} from '../contexts/knowledge-management/modules/documents/infra/file-storage';
import { PrismaClassificationLookupAdapter } from '../contexts/knowledge-management/modules/documents/infra/prisma-classification-lookup.adapter';
import { PrismaDocumentRepository } from '../contexts/knowledge-management/modules/documents/infra/prisma-document.repository';
import { PrismaEmbeddingRepository } from '../contexts/knowledge-management/modules/documents/infra/prisma-embedding.repository';
import { PrismaSpaceAccessAdapter } from '../contexts/knowledge-management/modules/documents/infra/prisma-space-access.adapter';
import { RedisRealtimeNotifierAdapter } from '../contexts/knowledge-management/modules/documents/infra/redis-realtime-notifier.adapter';
import type { EmbeddingProviderPort } from '../contexts/knowledge-management/modules/documents/ports/embedding-provider.port';
import { DeleteDocumentUseCase } from '../contexts/knowledge-management/modules/documents/use-cases/delete-document/delete-document.use-case';
import { ListDocumentsUseCase } from '../contexts/knowledge-management/modules/documents/use-cases/list-documents/list-documents.use-case';
import { ProcessDocumentUseCase } from '../contexts/knowledge-management/modules/documents/use-cases/process-document/process-document.use-case';
import { ReprocessDocumentUseCase } from '../contexts/knowledge-management/modules/documents/use-cases/reprocess-document/reprocess-document.use-case';
import { SearchChunksUseCase } from '../contexts/knowledge-management/modules/documents/use-cases/search-chunks/search-chunks.use-case';
import { UploadDocumentUseCase } from '../contexts/knowledge-management/modules/documents/use-cases/upload-document/upload-document.use-case';
import { PrismaOrganizationMembershipAdapter } from '../contexts/knowledge-management/modules/projects/infra/prisma-organization-membership.adapter';
import { PrismaSpaceRepository } from '../contexts/knowledge-management/modules/projects/infra/prisma-space.repository';
import { CreateSpaceUseCase } from '../contexts/knowledge-management/modules/projects/use-cases/create-space/create-space.use-case';
import { ListSpacesByOrganizationUseCase } from '../contexts/knowledge-management/modules/projects/use-cases/list-spaces-by-organization/list-spaces-by-organization.use-case';
import { PrismaCatalogRepository } from '../contexts/parameters/modules/catalogs/infra/prisma-catalog.repository';
import { ListCatalogItemsUseCase } from '../contexts/parameters/modules/catalogs/use-cases/list-catalog-items/list-catalog-items.use-case';
import { env } from './config/env';
import { BullMqDocumentProcessingQueue } from './queue/document-processing.queue';

const userRepository = new PrismaUserRepository();
const sessionRepository = new PrismaSessionRepository();
const passwordHasher = new BcryptPasswordHasher();

const organizationRepository = new PrismaOrganizationRepository();

const spaceRepository = new PrismaSpaceRepository();
const organizationMembership = new PrismaOrganizationMembershipAdapter();

const documentRepository = new PrismaDocumentRepository();
const embeddingRepository = new PrismaEmbeddingRepository();
const spaceAccess = new PrismaSpaceAccessAdapter();
const classificationLookup = new PrismaClassificationLookupAdapter();
const realtimeNotifier = new RedisRealtimeNotifierAdapter();
const documentProcessingQueue = new BullMqDocumentProcessingQueue();
const catalogRepository = new PrismaCatalogRepository();

const fileStorage = {
  buildPath: buildDocumentPath,
  save: saveDocumentFile,
  read: readDocumentFile,
  remove: deleteDocumentFile,
};

function createEmbeddingProvider(): EmbeddingProviderPort {
  if (env.EMBEDDING_PROVIDER === 'gemini') {
    return new GeminiEmbeddingAdapter(env.GEMINI_API_KEY, env.EMBEDDING_MODEL, env.EMBEDDING_DIM);
  }
  return new OllamaEmbeddingAdapter(env.OLLAMA_BASE_URL, env.EMBEDDING_MODEL, env.EMBEDDING_DIM);
}

const embeddingProvider = createEmbeddingProvider();

export const container = {
  // identity/auth
  registerUser: new RegisterUserUseCase(userRepository, sessionRepository, passwordHasher),
  loginUser: new LoginUserUseCase(userRepository, sessionRepository, passwordHasher),
  logoutUser: new LogoutUserUseCase(sessionRepository),
  getCurrentUser: new GetCurrentUserUseCase(userRepository, sessionRepository),

  // identity/organizations
  createOrganization: new CreateOrganizationUseCase(organizationRepository),
  listMyOrganizations: new ListMyOrganizationsUseCase(organizationRepository),

  // knowledge-management/projects (spaces)
  createSpace: new CreateSpaceUseCase(spaceRepository, organizationMembership),
  listSpacesByOrganization: new ListSpacesByOrganizationUseCase(
    spaceRepository,
    organizationMembership,
  ),

  // knowledge-management/documents
  uploadDocument: new UploadDocumentUseCase(
    documentRepository,
    organizationMembership,
    spaceAccess,
    classificationLookup,
    fileStorage,
    documentProcessingQueue,
  ),
  processDocument: new ProcessDocumentUseCase(
    documentRepository,
    embeddingRepository,
    embeddingProvider,
    spaceAccess,
    fileStorage,
    realtimeNotifier,
  ),
  listDocuments: new ListDocumentsUseCase(documentRepository, organizationMembership, spaceAccess),
  deleteDocument: new DeleteDocumentUseCase(
    documentRepository,
    embeddingRepository,
    organizationMembership,
    spaceAccess,
    fileStorage,
  ),
  reprocessDocument: new ReprocessDocumentUseCase(
    documentRepository,
    organizationMembership,
    spaceAccess,
    documentProcessingQueue,
  ),
  searchChunks: new SearchChunksUseCase(
    embeddingRepository,
    embeddingProvider,
    organizationMembership,
    spaceAccess,
  ),

  // parameters/catalogs
  listCatalogItems: new ListCatalogItemsUseCase(catalogRepository),
};
