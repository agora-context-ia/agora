import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/lib/api';
import { useAiProviderSettings } from '../application/use-ai-provider-settings';
import type { AiProviderSetting } from '../domain/settings';

export function AiModelsSettingsSection() {
  const { providers, isLoading, canEdit, saveApiKey } = useAiProviderSettings();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Modelos IA</h3>
        <p className="text-xs text-muted-foreground">
          API keys de proveedores de IA para toda la organización. La key se guarda cifrada y
          nunca vuelve a mostrarse completa.
        </p>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Cargando…</p>}

      {!isLoading &&
        providers.map((provider) => (
          <ProviderCard
            key={provider.provider}
            provider={provider}
            canEdit={canEdit}
            onSave={saveApiKey}
          />
        ))}
    </div>
  );
}

interface ProviderCardProps {
  provider: AiProviderSetting;
  canEdit: boolean;
  onSave: (provider: string, apiKey: string) => Promise<void>;
}

function ProviderCard({ provider, canEdit, onSave }: ProviderCardProps) {
  const [apiKey, setApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (apiKey.trim().length < 8) return;
    setIsSaving(true);
    setError(null);
    try {
      await onSave(provider.provider, apiKey.trim());
      setApiKey('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error inesperado, intenta de nuevo');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">{provider.label}</p>
        </div>
        {provider.configured ? (
          <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">
            Configurada ···· {provider.apiKeyLastFour}
          </span>
        ) : (
          <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
            Sin configurar
          </span>
        )}
      </div>

      <p className="mt-1 text-xs text-muted-foreground">
        Modelos disponibles: {provider.models.map((model) => model.label).join(', ')}
      </p>

      <div className="mt-3 flex gap-2">
        <Input
          type="password"
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
          placeholder={provider.configured ? 'Reemplazar API key…' : 'Pegar API key…'}
          disabled={!canEdit || isSaving}
          autoComplete="off"
        />
        <Button
          onClick={handleSave}
          disabled={!canEdit || isSaving || apiKey.trim().length < 8}
        >
          {isSaving ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>

      {!canEdit && (
        <p className="mt-2 text-xs text-muted-foreground">
          Solo un admin de la organización puede configurar esto.
        </p>
      )}
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
