import { FileText } from 'lucide-react';
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

export function ProjectListItem({ project, isActive, onSelect }: ProjectListItemProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(project.id)}
      className={cn(
        'w-full rounded-md border px-3 py-2.5 text-left transition-colors',
        isActive ? 'border-primary/40 bg-accent' : 'border-transparent hover:bg-accent/60',
      )}
    >
      <p className="truncate text-sm font-medium text-foreground">{project.name}</p>
      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        <FileText className="h-3.5 w-3.5" />
        <span>{project.docCount} documentos</span>
        <span aria-hidden>·</span>
        <span>{formatRelativeDate(project.updatedAt)}</span>
      </div>
    </button>
  );
}
