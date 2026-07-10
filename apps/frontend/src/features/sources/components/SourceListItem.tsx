import { FileJson, FileSpreadsheet, FileText, RefreshCw, Trash2 } from 'lucide-react';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Source, SourceFileType, SourceStatus } from '../domain/source';
import { useDeleteSource } from '../application/use-delete-source';
import { useReprocessSource } from '../application/use-reprocess-source';

const FILE_ICONS: Record<SourceFileType, typeof FileText> = {
  pdf: FileText,
  docx: FileText,
  txt: FileText,
  md: FileText,
  csv: FileSpreadsheet,
  json: FileJson,
};

const STATUS_LABEL: Record<SourceStatus, string> = {
  pending: 'En cola',
  processing: 'Procesando…',
  ready: 'Listo',
  error: 'Error',
};

// Mapeo semántico: verde = éxito, acento = en curso, rojo = error, gris = en cola.
const STATUS_VARIANT: Record<SourceStatus, BadgeProps['variant']> = {
  pending: 'muted',
  processing: 'info',
  ready: 'success',
  error: 'destructive',
};

interface SourceListItemProps {
  organizationId: string;
  projectId: string;
  source: Source;
}

export function SourceListItem({ organizationId, projectId, source }: SourceListItemProps) {
  const { deleteSource, deletingId } = useDeleteSource(organizationId, projectId);
  const { reprocessSource, reprocessingId } = useReprocessSource(organizationId, projectId);
  const Icon = FILE_ICONS[source.fileType];

  return (
    <div className="rounded-lg border">
      <div className="flex items-center gap-3 px-4 py-3">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{source.fileName}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(source.uploadedAt).toLocaleDateString('es-AR')}
            {source.classification && ` · ${source.classification.name}`}
          </p>
        </div>
        <Badge variant={STATUS_VARIANT[source.status]} title={source.processingError ?? undefined}>
          {STATUS_LABEL[source.status]}
        </Badge>
        {source.status === 'error' && (
          <Button
            variant="ghost"
            size="icon"
            title="Reintentar procesamiento"
            onClick={() => reprocessSource(source.id)}
            disabled={reprocessingId === source.id}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          title="Eliminar fuente"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => deleteSource(source.id)}
          disabled={deletingId === source.id}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {source.status === 'error' && source.processingError && (
        <p className="border-t px-4 py-2 text-xs text-destructive">{source.processingError}</p>
      )}
    </div>
  );
}
