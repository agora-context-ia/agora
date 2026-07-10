import { create } from 'zustand';
import type { Project } from '../domain/project';

interface ProjectStoreState {
  projects: Project[];
  activeProjectId: string | null;
  isLoading: boolean;
  // Organización cuyos proyectos están cargados: cambiar de organización
  // dispara una recarga (y recalcula el proyecto activo).
  loadedOrganizationId: string | null;
  setProjects: (projects: Project[], organizationId: string) => void;
  clearProjects: () => void;
  setLoading: (isLoading: boolean) => void;
  setActiveProject: (projectId: string | null) => void;
  addProject: (project: Project) => void;
}

export const useProjectStore = create<ProjectStoreState>((set) => ({
  projects: [],
  activeProjectId: null,
  isLoading: false,
  loadedOrganizationId: null,
  setProjects: (projects, organizationId) =>
    set({
      projects,
      loadedOrganizationId: organizationId,
      // Al cambiar de organización el proyecto activo anterior ya no
      // existe en la lista: se selecciona el primero (o ninguno).
      activeProjectId: projects[0]?.id ?? null,
      // isLoading se apaga acá (de forma atómica con los datos) y no en el
      // .finally del efecto: al setear loadedOrganizationId el efecto se
      // re-ejecuta y cancela el closure anterior antes de su .finally.
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

export function useActiveProject(): Project | null {
  const projects = useProjectStore((state) => state.projects);
  const activeProjectId = useProjectStore((state) => state.activeProjectId);
  return projects.find((project) => project.id === activeProjectId) ?? null;
}
