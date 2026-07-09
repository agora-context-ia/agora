import { useEffect } from 'react';
import { mockProjectApiAdapter } from '../infra/mock-project-api.adapter';
import { useProjectStore } from './use-active-project';

export function useProjectList() {
  const projects = useProjectStore((state) => state.projects);
  const isLoading = useProjectStore((state) => state.isLoading);
  const hasLoaded = useProjectStore((state) => state.hasLoaded);
  const setProjects = useProjectStore((state) => state.setProjects);
  const setLoading = useProjectStore((state) => state.setLoading);

  useEffect(() => {
    if (hasLoaded) return;

    let cancelled = false;
    setLoading(true);

    mockProjectApiAdapter.list().then((result) => {
      if (cancelled) return;
      setProjects(result);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [hasLoaded, setLoading, setProjects]);

  return { projects, isLoading };
}
