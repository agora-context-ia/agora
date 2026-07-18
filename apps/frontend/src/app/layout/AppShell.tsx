import { useState } from 'react';
import { FolderKanban, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { UserSidebar } from '@/features/auth/components/UserSidebar';
import { ChatWindow } from '@/features/chat/components/ChatWindow';
import { OnboardingScreen } from '@/features/organizations/components/OnboardingScreen';
import { useOrganizationList } from '@/features/organizations/application/use-organization-list';
import { ProjectSidebar } from '@/features/projects/components/ProjectSidebar';
import { SettingsDialog } from '@/features/settings/components/SettingsDialog';

/** Authenticated layout: sidebar + routed content, plus onboarding gate. */
export function AppShell() {
  const { organizations, hasLoaded } = useOrganizationList();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);

  if (!hasLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Cargando…</p>
      </div>
    );
  }

  // Freshly registered user: no organizations yet.
  if (organizations.length === 0) {
    return <OnboardingScreen />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Desktop: sidebar docked inline. */}
      <div className="hidden md:flex">
        <UserSidebar />
      </div>

      {/* Mobile: sidebar as an off-canvas drawer. */}
      <Sheet open={userMenuOpen} onOpenChange={setUserMenuOpen}>
        <SheetContent side="left" className="p-0 md:hidden">
          <SheetTitle className="sr-only">Menú</SheetTitle>
          <UserSidebar variant="mobile" />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar: opens the two drawers that replace the desktop columns. */}
        <header className="flex shrink-0 items-center justify-between border-b px-2 py-2 md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setUserMenuOpen(true)}>
            <Menu className="h-4 w-4" />
            <span className="sr-only">Abrir menú</span>
          </Button>
          <span className="text-sm font-semibold text-foreground">Ágora</span>
          <Button variant="ghost" size="icon" onClick={() => setProjectMenuOpen(true)}>
            <FolderKanban className="h-4 w-4" />
            <span className="sr-only">Abrir proyectos</span>
          </Button>
        </header>

        <main className="min-w-0 flex-1 overflow-hidden">
          <ChatWindow />
        </main>
      </div>

      {/* Desktop: project list docked inline. */}
      <aside className="hidden w-[300px] shrink-0 border-l md:block">
        <ProjectSidebar />
      </aside>

      {/* Mobile: project list as an off-canvas drawer. */}
      <Sheet open={projectMenuOpen} onOpenChange={setProjectMenuOpen}>
        <SheetContent side="right" className="p-0 md:hidden">
          <SheetTitle className="sr-only">Proyectos</SheetTitle>
          <ProjectSidebar onSelect={() => setProjectMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      <SettingsDialog />
    </div>
  );
}
