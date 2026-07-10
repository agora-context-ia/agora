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
import { PrismaOrganizationMembershipAdapter } from '../contexts/knowledge-management/modules/projects/infra/prisma-organization-membership.adapter';
import { PrismaSpaceRepository } from '../contexts/knowledge-management/modules/projects/infra/prisma-space.repository';
import { CreateSpaceUseCase } from '../contexts/knowledge-management/modules/projects/use-cases/create-space/create-space.use-case';
import { ListSpacesByOrganizationUseCase } from '../contexts/knowledge-management/modules/projects/use-cases/list-spaces-by-organization/list-spaces-by-organization.use-case';

const userRepository = new PrismaUserRepository();
const sessionRepository = new PrismaSessionRepository();
const passwordHasher = new BcryptPasswordHasher();

const organizationRepository = new PrismaOrganizationRepository();

const spaceRepository = new PrismaSpaceRepository();
const organizationMembership = new PrismaOrganizationMembershipAdapter();

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
};
