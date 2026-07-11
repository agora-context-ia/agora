import { FileText, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Project } from '../domain/project';

interface ProjectListItemProps {
  project: Project;
  isActive: boolean;
  onSelect: (projectId: string) => void;
}

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'hoy';
  if (diffDays === 1) return 'ayer';
  return `hace ${diffDays} días`;
}

/** Row for one project with selection state and actions menu. */
export function ProjectListItem({ project, isActive, onSelect }: ProjectListItemProps) {
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        'group flex items-center gap-0.5 rounded-md border pr-1 transition-colors',
        isActive ? 'border-primary/40 bg-accent' : 'border-transparent hover:bg-accent/60',
      )}
    >
      <button type="button" onClick={() => onSelect(project.id)} className="min-w-0 flex-1 px-3 py-2.5 text-left">
        <p className="truncate text-sm font-medium text-foreground">{project.name}</p>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <FileText className="h-3.5 w-3.5" />
          <span>{project.docCount} documentos</span>
          <span aria-hidden>·</span>
          <span>{formatRelativeDate(project.updatedAt)}</span>
        </div>
      </button>

      {/* Kebab button: always visible on the active project, shown on hover/focus elsewhere to keep the list clean. */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100',
              isActive && 'opacity-100',
            )}
            onClick={(event) => event.stopPropagation()}
          >
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Opciones del proyecto</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => navigate(`/projects/${project.id}/sources`)}>
            Ver fuentes
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
