import { useState, type KeyboardEvent } from 'react';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ModeSelector } from './ModeSelector';
import { ModelSelector } from './ModelSelector';
import type { ChatMode } from '../domain/mode';

interface ChatInputProps {
  mode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  model: string | null;
  onModelChange: (model: string | null) => void;
  onSend: (content: string) => void;
  disabled?: boolean;
}

/** Message composer with mode and model selectors. */
export function ChatInput({ mode, onModeChange, model, onModelChange, onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('');

  const handleSend = () => {
    if (!value.trim() || disabled) return;
    onSend(value);
    setValue('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-4">
      <div className="rounded-lg border bg-card p-2">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribí tu pregunta sobre este proyecto…"
          className="min-h-[52px] border-none px-2 shadow-none focus-visible:ring-0"
          disabled={disabled}
        />
        <div className="flex items-center gap-1.5 px-1 pb-1 pt-1">
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <ModeSelector mode={mode} onModeChange={onModeChange} />
            <ModelSelector model={model} onModelChange={onModelChange} />
          </div>
          <Button size="icon" className="shrink-0" onClick={handleSend} disabled={disabled || !value.trim()}>
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
