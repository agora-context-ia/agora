import { useState, type ReactNode } from 'react';
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
import { useCreateOrganization } from '../application/use-create-organization';

interface CreateOrganizationDialogProps {
  trigger: ReactNode;
}

/** Modal form to create an organization; the new one becomes active. */
export function CreateOrganizationDialog({ trigger }: CreateOrganizationDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const { createOrganization, isSubmitting, error } = useCreateOrganization();

  const handleSubmit = async () => {
    if (name.trim().length < 2) return;

    const success = await createOrganization(name.trim());
    if (success) {
      setOpen(false);
      setName('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear organización</DialogTitle>
          <DialogDescription>
            Los proyectos y sus miembros viven dentro de una organización.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Input
            placeholder="Nombre de la organización"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void handleSubmit();
            }}
            autoFocus
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={name.trim().length < 2 || isSubmitting}>
            {isSubmitting ? 'Creando…' : 'Crear organización'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
