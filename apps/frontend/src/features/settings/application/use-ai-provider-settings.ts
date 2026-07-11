import { useCallback, useEffect } from 'react';
import { create } from 'zustand';
import { useActiveOrganization } from '@/features/organizations/application/use-active-organization';
import { settingsApiAdapter } from '../infra/http-settings-api.adapter';
import type { AiProviderSetting } from '../domain/settings';

// Estado compartido entre la sección de Settings y el ModelSelector del
// chat: una sola carga por organización activa, y el guardado de una key
// refresca a todos los consumidores.
interface AiSettingsStoreState {
  organizationId: string | null;
  providers: AiProviderSetting[];
  isLoading: boolean;
  hasLoaded: boolean;
  load: (organizationId: string) => Promise<void>;
}

export const useAiSettingsStore = create<AiSettingsStoreState>((set, get) => ({
  organizationId: null,
  providers: [],
  isLoading: false,
  hasLoaded: false,
  load: async (organizationId) => {
    set({ organizationId, isLoading: true, hasLoaded: false });
    try {
      const providers = await settingsApiAdapter.listAiProviders(organizationId);
      // La organización activa pudo cambiar mientras cargaba: se descarta.
      if (get().organizationId !== organizationId) return;
      set({ providers, isLoading: false, hasLoaded: true });
    } catch {
      if (get().organizationId !== organizationId) return;
      set({ providers: [], isLoading: false, hasLoaded: true });
    }
  },
}));

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

  // Solo owner/admin de la organización activa pueden cargar/editar keys.
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
