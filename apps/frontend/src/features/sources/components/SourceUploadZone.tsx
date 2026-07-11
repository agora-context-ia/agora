import { useRef, useState, type DragEvent } from 'react';
import { UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useClassifications } from '../application/use-classifications';
import { useUploadSource } from '../application/use-upload-source';

interface SourceUploadZoneProps {
  organizationId: string;
  projectId: string;
}

/** Drag-and-drop / file-picker zone with the mandatory classification select. */
export function SourceUploadZone({ organizationId, projectId }: SourceUploadZoneProps) {
  const { uploadSource, isUploading, error } = useUploadSource(organizationId, projectId);
  const { classifications } = useClassifications();
  const [classificationCode, setClassificationCode] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // A classification is required before uploading.
  const selectedCode = classificationCode || classifications[0]?.code || '';

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file && selectedCode) uploadSource(file, selectedCode);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOver(false);
    handleFiles(event.dataTransfer.files);
  };

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setIsDraggingOver(true);
      }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={handleDrop}
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-8 text-center transition-colors',
        isDraggingOver ? 'border-primary bg-accent/60' : 'border-border',
      )}
    >
      <UploadCloud className="h-6 w-6 text-muted-foreground" />
      <p className="text-sm text-foreground">Arrastrá un archivo acá o subilo manualmente</p>
      <p className="text-xs text-muted-foreground">PDF, DOCX, TXT, MD, CSV o JSON · máx. 20 MB</p>

      <div className="mt-1 flex items-center gap-2">
        <select
          value={selectedCode}
          onChange={(event) => setClassificationCode(event.target.value)}
          disabled={classifications.length === 0}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          aria-label="Clasificación del documento"
        >
          {classifications.length === 0 && <option value="">Cargando clasificaciones…</option>}
          {classifications.map((item) => (
            <option key={item.code} value={item.code}>
              {item.name}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading || !selectedCode}
        >
          {isUploading ? 'Subiendo…' : 'Subir fuente'}
        </Button>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.docx,.txt,.md,.csv,.json"
        onChange={(event) => {
          handleFiles(event.target.files);
          // Se limpia el valor para poder volver a subir el mismo archivo dos veces seguidas.
          event.target.value = '';
        }}
      />
    </div>
  );
}
