import type {
  CreateOrganizationInvitationResponseDto,
  OrganizationInvitationDto,
  OrganizationMemberDto,
} from '@contexthub-ai/shared-types';
import { apiFetch } from '@/lib/api';
import type { OrganizationInvitation, OrganizationMember } from '../domain/collaboration';
import type { CollaborationApiPort, CollaborationSnapshot } from '../ports/collaboration-api.port';

function toMember(dto: OrganizationMemberDto): OrganizationMember { return dto; }
function toInvitation(dto: OrganizationInvitationDto): OrganizationInvitation {
  return { id: dto.id, email: dto.email, role: dto.role, expiresAt: dto.expiresAt };
}

class HttpCollaborationApiAdapter implements CollaborationApiPort {
  async get(organizationId: string): Promise<CollaborationSnapshot> {
    const result = await apiFetch<{ members: OrganizationMemberDto[]; invitations: OrganizationInvitationDto[] }>(`/api/organizations/${organizationId}/collaboration`);
    return { members: result.members.map(toMember), invitations: result.invitations.map(toInvitation) };
  }

  async invite(organizationId: string, email: string, role: 'admin' | 'member') {
    const result = await apiFetch<CreateOrganizationInvitationResponseDto>(`/api/organizations/${organizationId}/invitations`, {
      method: 'POST', body: JSON.stringify({ email, role }),
    });
    return { invitation: toInvitation(result.invitation), invitationUrl: result.invitationUrl };
  }

  async revoke(organizationId: string, invitationId: string): Promise<void> {
    await apiFetch(`/api/organizations/${organizationId}/invitations/${invitationId}`, { method: 'DELETE' });
  }

  async accept(token: string): Promise<string> {
    const result = await apiFetch<{ organizationId: string }>('/api/organization-invitations/accept', { method: 'POST', body: JSON.stringify({ token }) });
    return result.organizationId;
  }
}

/** HTTP implementation of collaboration operations. */
export const collaborationApiAdapter = new HttpCollaborationApiAdapter();
