import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ApiError } from '@/lib/api';
import { projectApiAdapter } from '../infra/http-project-api.adapter';
import { useProjectStore } from '../application/use-active-project';
import { useOrganizationStore } from '@/features/organizations/application/use-active-organization';

export function CreateProjectDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addProject = useProjectStore((state) => state.addProject);
  const activeOrganizationId = useOrganizationStore((state) => state.activeOrganizationId);

  const handleSubmit = async () => {
    if (!name.trim() || !activeOrganizationId) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const project = await projectApiAdapter.create({
        organizationId: activeOrganizationId,
        name: name.trim(),
        description: description.trim(),
      });
      addProject(project);
      setOpen(false);
      setName('');
      setDescription('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo conectar con el servidor');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) setError(null);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <Plus className="h-4 w-4" />
          Nuevo proyecto
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear proyecto</DialogTitle>
          <DialogDescription>Los documentos y conversaciones se organizan dentro de cada proyecto.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Input placeholder="Nombre del proyecto" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          <Textarea
            placeholder="Descripción breve (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || !activeOrganizationId || isSubmitting}>
            {isSubmitting ? 'Creando…' : 'Crear proyecto'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
