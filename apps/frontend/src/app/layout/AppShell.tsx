import { UserSidebar } from '@/features/auth/components/UserSidebar';
import { ChatWindow } from '@/features/chat/components/ChatWindow';
import { OnboardingScreen } from '@/features/organizations/components/OnboardingScreen';
import { useOrganizationList } from '@/features/organizations/application/use-organization-list';
import { ProjectSidebar } from '@/features/projects/components/ProjectSidebar';
import { SettingsDialog } from '@/features/settings/components/SettingsDialog';

/** Authenticated layout: sidebar + routed content, plus onboarding gate. */
export function AppShell() {
  const { organizations, hasLoaded } = useOrganizationList();

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
      <UserSidebar />
      <main className="min-w-0 flex-1">
        <ChatWindow />
      </main>
      <aside className="w-[300px] shrink-0 border-l">
        <ProjectSidebar />
      </aside>
      <SettingsDialog />
    </div>
  );
}
