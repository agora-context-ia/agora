import { create } from 'zustand';
import type { Organization } from '../domain/organization';

interface OrganizationStoreState {
  organizations: Organization[];
  activeOrganizationId: string | null;
  isLoading: boolean;
  hasLoaded: boolean;
  setOrganizations: (organizations: Organization[]) => void;
  setLoading: (isLoading: boolean) => void;
  setActiveOrganization: (organizationId: string) => void;
  addOrganization: (organization: Organization) => void;
}

/**
 * Store holding the user's organizations and the active selection.
 * Internal to the organizations feature: other features must consume the
 * named hooks below instead of the raw store (see AGENTS.md).
 */
export const useOrganizationStore = create<OrganizationStoreState>((set) => ({
  organizations: [],
  activeOrganizationId: null,
  isLoading: false,
  hasLoaded: false,
  setOrganizations: (organizations) =>
    set((state) => ({
      organizations,
      hasLoaded: true,
      activeOrganizationId: state.activeOrganizationId ?? organizations[0]?.id ?? null,
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setActiveOrganization: (organizationId) => set({ activeOrganizationId: organizationId }),
  addOrganization: (organization) =>
    set((state) => ({
      organizations: [...state.organizations, organization],
      activeOrganizationId: organization.id,
      hasLoaded: true,
    })),
}));

/** Returns the currently selected organization, or null before any is chosen. */
export function useActiveOrganization(): Organization | null {
  const organizations = useOrganizationStore((state) => state.organizations);
  const activeOrganizationId = useOrganizationStore((state) => state.activeOrganizationId);
  return organizations.find((organization) => organization.id === activeOrganizationId) ?? null;
}

/** Returns just the active organization id — lighter than {@link useActiveOrganization}. */
export function useActiveOrganizationId(): string | null {
  return useOrganizationStore((state) => state.activeOrganizationId);
}
