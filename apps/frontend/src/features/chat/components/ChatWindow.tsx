import { useState } from 'react';
import { useActiveProject } from '@/features/projects/application/use-active-project';
import { useConversation } from '../application/use-conversation';
import { useSendMessage } from '../application/use-send-message';
import type { ChatMode } from '../domain/mode';
import { ChatInput } from './ChatInput';
import { EmptyState } from './EmptyState';
import { MessageList } from './MessageList';

export function ChatWindow() {
  const activeProject = useActiveProject();
  const { messages, isLoading, isSending } = useConversation(activeProject?.id ?? null);
  const { sendMessage } = useSendMessage(activeProject?.id ?? null);
  const [mode, setMode] = useState<ChatMode>('general');

  if (!activeProject) {
    return (
      <div className="flex h-full flex-col">
        <EmptyState variant="no-project" />
      </div>
    );
  }

  const hasMessages = messages.length > 0 || isLoading;

  return (
    <div className="flex h-full flex-col">
      <header className="border-b px-4 py-3">
        <h1 className="text-sm font-semibold text-foreground">{activeProject.name}</h1>
        <p className="text-xs text-muted-foreground">{activeProject.description}</p>
      </header>

      {hasMessages ? (
        <MessageList messages={messages} isSending={isSending} />
      ) : (
        <div className="flex-1">
          <EmptyState variant="no-conversation" projectName={activeProject.name} />
        </div>
      )}

      <ChatInput mode={mode} onModeChange={setMode} onSend={(content) => sendMessage(content, mode)} disabled={isSending} />
    </div>
  );
}
