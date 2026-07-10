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

export function useActiveOrganization(): Organization | null {
  const organizations = useOrganizationStore((state) => state.organizations);
  const activeOrganizationId = useOrganizationStore((state) => state.activeOrganizationId);
  return organizations.find((organization) => organization.id === activeOrganizationId) ?? null;
}
