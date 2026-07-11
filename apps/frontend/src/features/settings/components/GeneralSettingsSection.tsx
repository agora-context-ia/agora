import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCurrentUser } from '@/features/auth/application/use-current-user';
import { useUpdateProfile } from '../application/use-update-profile';

export function GeneralSettingsSection() {
  const { user } = useCurrentUser();
  const { updateProfile, isSaving, error } = useUpdateProfile();
  const [fullName, setFullName] = useState(user?.name ?? '');
  const [saved, setSaved] = useState(false);

  // Sincroniza el input si el usuario carga después de abrir el modal.
  useEffect(() => {
    setFullName(user?.name ?? '');
  }, [user?.name]);

  const isDirty = fullName.trim() !== (user?.name ?? '') && fullName.trim().length >= 2;

  const handleSave = async () => {
    const success = await updateProfile(fullName.trim());
    if (success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-sm font-semibold text-foreground">General</h3>
        <p className="text-xs text-muted-foreground">Datos básicos de tu cuenta.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="settings-full-name" className="text-xs font-medium text-foreground">
          Nombre completo
        </label>
        <Input
          id="settings-full-name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          placeholder="Tu nombre"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="settings-email" className="text-xs font-medium text-foreground">
          Email
        </label>
        <Input id="settings-email" value={user?.email ?? ''} disabled />
        <p className="text-xs text-muted-foreground">El email no se puede cambiar por ahora.</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={!isDirty || isSaving}>
          {isSaving ? 'Guardando…' : 'Guardar cambios'}
        </Button>
        {saved && <span className="text-xs text-muted-foreground">Cambios guardados ✓</span>}
      </div>
    </div>
  );
}
