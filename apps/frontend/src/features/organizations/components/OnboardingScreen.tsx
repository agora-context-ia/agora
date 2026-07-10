import { Building2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useLogout } from '@/features/auth/application/use-logout';
import { CreateOrganizationDialog } from './CreateOrganizationDialog';

// Primer login: el usuario todavía no pertenece a ninguna organización.
export function OnboardingScreen() {
  const { logout, isLoggingOut } = useLogout();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-accent">
            <Building2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>Creá tu primera organización</CardTitle>
          <CardDescription>
            Todo en ContextHub AI vive dentro de una organización: sus espacios de conocimiento y
            las personas que invites a trabajar en ellos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateOrganizationDialog
            trigger={
              <Button className="w-full">
                <Plus className="h-4 w-4" />
                Crear organización
              </Button>
            }
          />
        </CardContent>
      </Card>
      <Button variant="ghost" className="text-muted-foreground" onClick={logout} disabled={isLoggingOut}>
        Cerrar sesión
      </Button>
    </div>
  );
}
