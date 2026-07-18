import { Check, ChevronDown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CHAT_MODES, type ChatMode } from '../domain/mode';

interface ModeSelectorProps {
  mode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
}

/** Dropdown to pick the task type (mode) of the next question. */
export function ModeSelector({ mode, onModeChange }: ModeSelectorProps) {
  const activeMode = CHAT_MODES.find((option) => option.value === mode) ?? CHAT_MODES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="min-w-0 max-w-full gap-1.5">
          <Sparkles className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{activeMode.label}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {CHAT_MODES.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onSelect={() => onModeChange(option.value)}
            className="flex items-start justify-between gap-2"
          >
            <div>
              <p className="text-sm">{option.label}</p>
              <p className="text-xs text-muted-foreground">{option.description}</p>
            </div>
            {option.value === mode && <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
