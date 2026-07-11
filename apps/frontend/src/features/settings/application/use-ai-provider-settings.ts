import { useCallback, useEffect } from 'react';
import { create } from 'zustand';
import { useActiveOrganization } from '@/features/organizations/application/use-active-organization';
import { settingsApiAdapter } from '../infra/http-settings-api.adapter';
import type { AiProviderSetting } from '../domain/settings';

// State shared between the Settings section and the chat ModelSelector:
// one load per active organization, and saving a key refreshes every
// consumer.
interface AiSettingsStoreState {
  organizationId: string | null;
  providers: AiProviderSetting[];
  isLoading: boolean;
  hasLoaded: boolean;
  load: (organizationId: string) => Promise<void>;
}

/** Store holding the AI provider settings of the active organization. */
export const useAiSettingsStore = create<AiSettingsStoreState>((set, get) => ({
  organizationId: null,
  providers: [],
  isLoading: false,
  hasLoaded: false,
  load: async (organizationId) => {
    set({ organizationId, isLoading: true, hasLoaded: false });
    try {
      const providers = await settingsApiAdapter.listAiProviders(organizationId);
      // The active organization may have changed while loading: discard.
      if (get().organizationId !== organizationId) return;
      set({ providers, isLoading: false, hasLoaded: true });
    } catch {
      if (get().organizationId !== organizationId) return;
      set({ providers: [], isLoading: false, hasLoaded: true });
    }
  },
}));

/** Loads (once per org) and saves AI provider settings; exposes role-based canEdit. */
export function useAiProviderSettings() {
  const activeOrganization = useActiveOrganization();
  const organizationId = useAiSettingsStore((state) => state.organizationId);
  const providers = useAiSettingsStore((state) => state.providers);
  const isLoading = useAiSettingsStore((state) => state.isLoading);
  const hasLoaded = useAiSettingsStore((state) => state.hasLoaded);
  const load = useAiSettingsStore((state) => state.load);

  useEffect(() => {
    if (!activeOrganization) return;
    if (activeOrganization.id === organizationId) return;
    void load(activeOrganization.id);
  }, [activeOrganization, organizationId, load]);

  // Only the active organization's owner/admin may create/edit keys.
  const canEdit =
    activeOrganization?.role === 'owner' || activeOrganization?.role === 'admin';

  const saveApiKey = useCallback(
    async (provider: string, apiKey: string) => {
      if (!activeOrganization) return;
      await settingsApiAdapter.saveAiProviderKey(activeOrganization.id, provider, apiKey);
      await load(activeOrganization.id);
    },
    [activeOrganization, load],
  );

  return { providers, isLoading: isLoading || !hasLoaded, canEdit, saveApiKey };
}
