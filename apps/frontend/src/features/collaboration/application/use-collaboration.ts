import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/lib/api';
import { collaborationApiAdapter } from '../infra/http-collaboration-api.adapter';
import type { OrganizationInvitation, OrganizationMember } from '../domain/collaboration';

/** Loads and mutates the active organization's collaboration state. */
export function useCollaboration(organizationId: string | null) {
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [invitations, setInvitations] = useState<OrganizationInvitation[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const result = await collaborationApiAdapter.get(organizationId);
      setMembers(result.members); setInvitations(result.invitations); setError(null);
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : 'No se pudo cargar la colaboración'); }
    finally { setLoading(false); }
  }, [organizationId]);

  useEffect(() => { void load(); }, [load]);

  const invite = async (email: string, role: 'admin' | 'member') => {
    if (!organizationId) return null;
    const result = await collaborationApiAdapter.invite(organizationId, email, role);
    setInvitations((current) => [result.invitation, ...current]);
    return result.invitationUrl;
  };

  const revoke = async (invitationId: string) => {
    if (!organizationId) return;
    await collaborationApiAdapter.revoke(organizationId, invitationId);
    setInvitations((current) => current.filter((item) => item.id !== invitationId));
  };

  return { members, invitations, isLoading, error, invite, revoke };
}
