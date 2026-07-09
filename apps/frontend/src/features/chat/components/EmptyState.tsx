import { FolderPlus, MessageSquare } from 'lucide-react';

interface EmptyStateProps {
  variant: 'no-project' | 'no-conversation';
  projectName?: string;
}

export function EmptyState({ variant, projectName }: EmptyStateProps) {
  if (variant === 'no-project') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <FolderPlus className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Elegí o creá un proyecto</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Seleccioná un proyecto en el panel de la derecha, o creá uno nuevo, para empezar a conversar con tus
            documentos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <MessageSquare className="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">
          Todavía no hay conversaciones en {projectName ?? 'este proyecto'}
        </p>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Escribí tu primera pregunta abajo para empezar a explorar la documentación de este proyecto.
        </p>
      </div>
    </div>
  );
}
