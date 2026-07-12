import { Bot, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useCurrentUser } from '@/features/auth/application/use-current-user';
import { cn } from '@/lib/utils';
import type { Message } from '../domain/message';
import { MarkdownContent } from './MarkdownContent';
import { SourcesFootnote } from './SourcesFootnote';

interface MessageBubbleProps {
  message: Message;
}

/** One message: assistant replies render as Markdown, user text as plain. */
export function MessageBubble({ message }: MessageBubbleProps) {
  const isAssistant = message.role === 'assistant';
  const { user } = useCurrentUser();

  return (
    <div className={cn('flex gap-3 px-1 py-3', isAssistant ? 'bg-transparent' : 'bg-transparent')}>
      <Avatar className={cn('h-7 w-7', isAssistant ? 'bg-primary/10' : 'bg-muted')}>
        <AvatarFallback className="bg-transparent">
          {isAssistant ? <Bot className="h-3.5 w-3.5 text-primary" /> : <User className="h-3.5 w-3.5" />}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-muted-foreground">
          {isAssistant ? 'Ágora' : user?.name ?? 'Vos'}
        </p>
        {isAssistant ? (
          <div className="mt-1">
            <MarkdownContent content={message.content} />
          </div>
        ) : (
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{message.content}</p>
        )}
        {message.sources && <SourcesFootnote sources={message.sources} />}
      </div>
    </div>
  );
}
