import { useEffect } from 'react';
import { useActiveOrganizationId } from '@/features/organizations/application/use-active-organization';
import { projectApiAdapter } from '../infra/http-project-api.adapter';
import { useProjectStore } from './use-active-project';

/** Loads the active organization's spaces and reloads when it changes. */
export function useProjectList() {
  const activeOrganizationId = useActiveOrganizationId();
  const projects = useProjectStore((state) => state.projects);
  const isLoading = useProjectStore((state) => state.isLoading);
  const loadedOrganizationId = useProjectStore((state) => state.loadedOrganizationId);
  const setProjects = useProjectStore((state) => state.setProjects);
  const clearProjects = useProjectStore((state) => state.clearProjects);
  const setLoading = useProjectStore((state) => state.setLoading);

  useEffect(() => {
    if (!activeOrganizationId) {
      clearProjects();
      return;
    }
    if (loadedOrganizationId === activeOrganizationId) return;

    let cancelled = false;
    setLoading(true);

    // setProjects turns isLoading off atomically (see store): .finally is
    // not used because the loadedOrganizationId change re-fires this
    // effect and cancels the closure before it runs.
    projectApiAdapter
      .list(activeOrganizationId)
      .then((result) => {
        if (cancelled) return;
        setProjects(result, activeOrganizationId);
      })
      .catch(() => {
        if (cancelled) return;
        setProjects([], activeOrganizationId);
      });

    return () => {
      cancelled = true;
    };
  }, [activeOrganizationId, loadedOrganizationId, clearProjects, setLoading, setProjects]);

  return { projects, isLoading };
}
