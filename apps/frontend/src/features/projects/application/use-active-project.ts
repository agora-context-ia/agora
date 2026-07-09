import { create } from 'zustand';
import type { Project } from '../domain/project';

interface ProjectStoreState {
  projects: Project[];
  activeProjectId: string | null;
  isLoading: boolean;
  hasLoaded: boolean;
  setProjects: (projects: Project[]) => void;
  setLoading: (isLoading: boolean) => void;
  setActiveProject: (projectId: string) => void;
  addProject: (project: Project) => void;
}

export const useProjectStore = create<ProjectStoreState>((set) => ({
  projects: [],
  activeProjectId: null,
  isLoading: false,
  hasLoaded: false,
  setProjects: (projects) =>
    set((state) => ({
      projects,
      hasLoaded: true,
      activeProjectId: state.activeProjectId ?? projects[0]?.id ?? null,
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setActiveProject: (projectId) => set({ activeProjectId: projectId }),
  addProject: (project) =>
    set((state) => ({
      projects: [project, ...state.projects],
      activeProjectId: project.id,
    })),
}));

export function useActiveProject(): Project | null {
  const projects = useProjectStore((state) => state.projects);
  const activeProjectId = useProjectStore((state) => state.activeProjectId);
  return projects.find((project) => project.id === activeProjectId) ?? null;
}
