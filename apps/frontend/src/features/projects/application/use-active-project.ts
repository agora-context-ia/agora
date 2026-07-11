import { create } from 'zustand';
import type { Project } from '../domain/project';

interface ProjectStoreState {
  projects: Project[];
  activeProjectId: string | null;
  isLoading: boolean;
  // Organization whose projects are loaded: switching organizations
  // triggers a reload (and recalculates the active project).
  loadedOrganizationId: string | null;
  setProjects: (projects: Project[], organizationId: string) => void;
  clearProjects: () => void;
  setLoading: (isLoading: boolean) => void;
  setActiveProject: (projectId: string | null) => void;
  addProject: (project: Project) => void;
}

/** Store holding the loaded projects and the active selection. */
export const useProjectStore = create<ProjectStoreState>((set) => ({
  projects: [],
  activeProjectId: null,
  isLoading: false,
  loadedOrganizationId: null,
  setProjects: (projects, organizationId) =>
    set({
      projects,
      loadedOrganizationId: organizationId,
      // After switching organizations the previous active project no
      // longer exists in the list: select the first one (or none).
      activeProjectId: projects[0]?.id ?? null,
      // isLoading turns off here (atomically with the data) and not in
      // the effect's .finally: setting loadedOrganizationId re-runs the
      // effect and cancels the previous closure before its .finally.
      isLoading: false,
    }),
  clearProjects: () =>
    set({ projects: [], loadedOrganizationId: null, activeProjectId: null, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  setActiveProject: (projectId) => set({ activeProjectId: projectId }),
  addProject: (project) =>
    set((state) => ({
      projects: [project, ...state.projects],
      activeProjectId: project.id,
    })),
}));

/** Returns the currently selected project, or null. */
export function useActiveProject(): Project | null {
  const projects = useProjectStore((state) => state.projects);
  const activeProjectId = useProjectStore((state) => state.activeProjectId);
  return projects.find((project) => project.id === activeProjectId) ?? null;
}
