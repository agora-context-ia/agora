import { useEffect, useMemo } from 'react';
import { Check, ChevronDown, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAiProviderSettings } from '@/features/settings/application/use-ai-provider-settings';
import { useSettingsDialog } from '@/features/settings/application/use-settings-dialog';
import type { ChatModelOption } from '../domain/model';

interface ModelSelectorProps {
  model: string | null;
  onModelChange: (model: string | null) => void;
}

/**
 * AI provider/model selector. Lives next to the ModeSelector (task
 * type): this one picks WHICH model answers. Fed by the keys configured
 * for the active organization; with none configured it becomes a CTA
 * that opens Settings directly on the AI Models section.
 */
export function ModelSelector({ model, onModelChange }: ModelSelectorProps) {
  const { providers, isLoading } = useAiProviderSettings();
  const openSettings = useSettingsDialog((state) => state.open);

  const options = useMemo<ChatModelOption[]>(
    () =>
      providers
        .filter((provider) => provider.configured)
        .flatMap((provider) =>
          provider.models.map((option) => ({
            value: option.value,
            label: option.label,
            providerLabel: provider.label,
          })),
        ),
    [providers],
  );

  // Default selection (first available model) and cleanup when the
  // chosen model no longer exists after switching organizations.
  useEffect(() => {
    if (isLoading) return;
    const exists = options.some((option) => option.value === model);
    if (!exists) onModelChange(options[0]?.value ?? null);
  }, [isLoading, options, model, onModelChange]);

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" className="gap-1.5" disabled>
        <Cpu className="h-3.5 w-3.5" />
        Cargando…
      </Button>
    );
  }

  if (options.length === 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 text-muted-foreground"
        onClick={() => openSettings('ai-models')}
      >
        <Cpu className="h-3.5 w-3.5" />
        Configurar modelo de IA →
      </Button>
    );
  }

  const activeOption = options.find((option) => option.value === model) ?? options[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Cpu className="h-3.5 w-3.5" />
          {activeOption.label}
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onSelect={() => onModelChange(option.value)}
            className="flex items-start justify-between gap-2"
          >
            <div>
              <p className="text-sm">{option.label}</p>
              <p className="text-xs text-muted-foreground">{option.providerLabel}</p>
            </div>
            {option.value === activeOption.value && (
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
