import { Settings2, Sparkles, UserRound } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useSettingsDialog, type SettingsSection } from '../application/use-settings-dialog';
import { AiModelsSettingsSection } from './AiModelsSettingsSection';
import { GeneralSettingsSection } from './GeneralSettingsSection';

const SECTIONS: Array<{ value: SettingsSection; label: string; icon: typeof UserRound }> = [
  { value: 'general', label: 'General', icon: UserRound },
  { value: 'ai-models', label: 'Modelos IA', icon: Sparkles },
];

/**
 * Centralized settings modal: side nav + content panel. Rendered once
 * (AppShell) and opened via useSettingsDialog.
 */
export function SettingsDialog() {
  const isOpen = useSettingsDialog((state) => state.isOpen);
  const section = useSettingsDialog((state) => state.section);
  const setSection = useSettingsDialog((state) => state.setSection);
  const close = useSettingsDialog((state) => state.close);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" /> Configuración
          </DialogTitle>
          <DialogDescription className="sr-only">
            Configuración de tu cuenta y de la organización activa.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-[360px]">
          <nav className="flex w-44 shrink-0 flex-col gap-0.5 border-r bg-muted/30 p-2">
            {SECTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setSection(value)}
                className={cn(
                  'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-accent',
                  section === value
                    ? 'bg-accent font-medium text-accent-foreground'
                    : 'text-muted-foreground',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </button>
            ))}
          </nav>

          <div className="min-w-0 flex-1 overflow-y-auto p-6">
            {section === 'general' ? <GeneralSettingsSection /> : <AiModelsSettingsSection />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
