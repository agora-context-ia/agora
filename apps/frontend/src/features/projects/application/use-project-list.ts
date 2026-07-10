import { useEffect } from 'react';
import { useOrganizationStore } from '@/features/organizations/application/use-active-organization';
import { projectApiAdapter } from '../infra/http-project-api.adapter';
import { useProjectStore } from './use-active-project';

// Carga los espacios de la organización activa y recarga al cambiarla.
export function useProjectList() {
  const activeOrganizationId = useOrganizationStore((state) => state.activeOrganizationId);
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

    // setProjects apaga isLoading de forma atómica (ver store): no se usa
    // .finally porque el cambio de loadedOrganizationId re-dispara este
    // efecto y cancela el closure antes de que corra.
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
