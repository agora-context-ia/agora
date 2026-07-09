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
import { mockProjectApiAdapter } from '../infra/mock-project-api.adapter';
import { useProjectStore } from '../application/use-active-project';

export function CreateProjectDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const addProject = useProjectStore((state) => state.addProject);

  const handleSubmit = async () => {
    if (!name.trim()) return;

    setIsSubmitting(true);
    const project = await mockProjectApiAdapter.create({ name: name.trim(), description: description.trim() });
    addProject(project);
    setIsSubmitting(false);
    setOpen(false);
    setName('');
    setDescription('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || isSubmitting}>
            {isSubmitting ? 'Creando…' : 'Crear proyecto'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
