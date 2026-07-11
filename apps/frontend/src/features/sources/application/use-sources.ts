import { useEffect } from 'react';
import { create } from 'zustand';
import { subscribeRealtime, subscribeRealtimeReconnect } from '@/lib/realtime';
import { sourceApiAdapter } from '../infra/http-source-api.adapter';
import type { Source } from '../domain/source';

interface SourceStoreState {
  sourcesByProject: Record<string, Source[]>;
  loadedProjectIds: Set<string>;
  isLoading: boolean;
  loadSources: (organizationId: string, projectId: string, force?: boolean) => Promise<void>;
  upsertSource: (projectId: string, source: Source) => void;
  removeSource: (projectId: string, sourceId: string) => void;
}

// Store compartido: la subida, el borrado y los eventos SSE actualizan la
// misma lista desde hooks distintos.
export const useSourceStore = create<SourceStoreState>((set, get) => ({
  sourcesByProject: {},
  loadedProjectIds: new Set(),
  isLoading: false,
  loadSources: async (organizationId, projectId, force = false) => {
    if (!force && get().loadedProjectIds.has(projectId)) return;

    set({ isLoading: true });
    try {
      const sources = await sourceApiAdapter.list(organizationId, projectId);
      set((state) => ({
        isLoading: false,
        sourcesByProject: { ...state.sourcesByProject, [projectId]: sources },
        loadedProjectIds: new Set(state.loadedProjectIds).add(projectId),
      }));
    } catch {
      set({ isLoading: false });
    }
  },
  upsertSource: (projectId, source) =>
    set((state) => {
      const current = state.sourcesByProject[projectId] ?? [];
      const exists = current.some((item) => item.id === source.id);
      const next = exists
        ? current.map((item) => (item.id === source.id ? source : item))
        : [source, ...current];
      return { sourcesByProject: { ...state.sourcesByProject, [projectId]: next } };
    }),
  removeSource: (projectId, sourceId) =>
    set((state) => ({
      sourcesByProject: {
        ...state.sourcesByProject,
        [projectId]: (state.sourcesByProject[projectId] ?? []).filter(
          (item) => item.id !== sourceId,
        ),
      },
    })),
}));

/**
 * Sources of the active project. No polling: the list refetches when the
 * space's document.updated SSE event arrives (and also after a channel
 * reconnection, in case an event was missed).
 */
export function useSources(organizationId: string | null, projectId: string | null) {
  const sourcesByProject = useSourceStore((state) => state.sourcesByProject);
  const isLoading = useSourceStore((state) => state.isLoading);
  const loadSources = useSourceStore((state) => state.loadSources);

  useEffect(() => {
    if (organizationId && projectId) loadSources(organizationId, projectId);
  }, [organizationId, projectId, loadSources]);

  useEffect(() => {
    if (!organizationId || !projectId) return;

    const unsubscribeEvents = subscribeRealtime((event) => {
      if (event.type === 'document.updated' && event.spaceId === projectId) {
        void loadSources(organizationId, projectId, true);
      }
    });
    const unsubscribeReconnect = subscribeRealtimeReconnect(() => {
      void loadSources(organizationId, projectId, true);
    });

    return () => {
      unsubscribeEvents();
      unsubscribeReconnect();
    };
  }, [organizationId, projectId, loadSources]);

  return { sources: projectId ? (sourcesByProject[projectId] ?? []) : [], isLoading };
}
