import { ChatWindow } from '@/features/chat/components/ChatWindow';
import { ProjectSidebar } from '@/features/projects/components/ProjectSidebar';

export function AppShell() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <main className="min-w-0 flex-1">
        <ChatWindow />
      </main>
      <aside className="w-[300px] shrink-0 border-l">
        <ProjectSidebar />
      </aside>
    </div>
  );
}
