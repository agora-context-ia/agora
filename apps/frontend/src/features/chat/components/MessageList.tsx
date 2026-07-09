import { useEffect, useRef } from 'react';
import { Bot } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Message } from '../domain/message';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  messages: Message[];
  isSending: boolean;
}

export function MessageList({ messages, isSending }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isSending]);

  return (
    <ScrollArea className="flex-1">
      <div className="mx-auto flex max-w-3xl flex-col divide-y divide-border/60 px-4 py-2">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isSending && (
          <div className="flex gap-3 px-1 py-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
              <Bot className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="flex items-center gap-1 pt-2">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
