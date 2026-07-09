import { ScrollArea } from '@/components/ui/scroll-area';
import { useProjectList } from '../application/use-project-list';
import { useProjectStore } from '../application/use-active-project';
import { ProjectListItem } from './ProjectListItem';
import { CreateProjectDialog } from './CreateProjectDialog';

export function ProjectSidebar() {
  const { projects, isLoading } = useProjectList();
  const activeProjectId = useProjectStore((state) => state.activeProjectId);
  const setActiveProject = useProjectStore((state) => state.setActiveProject);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-4">
        <h2 className="text-sm font-semibold text-foreground">Proyectos</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">Espacios de conocimiento</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-1 p-2">
          {isLoading && (
            <div className="px-3 py-2 text-xs text-muted-foreground">Cargando proyectos…</div>
          )}
          {!isLoading &&
            projects.map((project) => (
              <ProjectListItem
                key={project.id}
                project={project}
                isActive={project.id === activeProjectId}
                onSelect={setActiveProject}
              />
            ))}
        </div>
      </ScrollArea>

      <div className="border-t p-3">
        <CreateProjectDialog />
      </div>
    </div>
  );
}
