import type { AiProviderSettingDto } from '@contexthub-ai/shared-types';
import { apiFetch } from '@/lib/api';
import type { User } from '@/features/auth/domain/user';
import type { AiProviderSetting } from '../domain/settings';
import type { SettingsApiPort } from '../ports/settings-api.port';

interface ApiUser {
  id: string;
  email: string;
  fullName: string;
}

function toSetting(dto: AiProviderSettingDto): AiProviderSetting {
  return {
    provider: dto.provider,
    label: dto.label,
    models: dto.models,
    configured: dto.configured,
    apiKeyLastFour: dto.apiKeyLastFour,
    updatedAt: dto.updatedAt,
  };
}

class HttpSettingsApiAdapter implements SettingsApiPort {
  async updateProfile(fullName: string): Promise<User> {
    const body = await apiFetch<{ user: ApiUser }>('/api/auth/me', {
      method: 'PATCH',
      body: JSON.stringify({ fullName }),
    });
    return { id: body.user.id, name: body.user.fullName, email: body.user.email };
  }

  async listAiProviders(organizationId: string): Promise<AiProviderSetting[]> {
    const body = await apiFetch<{ providers: AiProviderSettingDto[] }>(
      `/api/organizations/${organizationId}/ai-settings`,
    );
    return body.providers.map(toSetting);
  }

  async saveAiProviderKey(
    organizationId: string,
    provider: string,
    apiKey: string,
  ): Promise<void> {
    await apiFetch(`/api/organizations/${organizationId}/ai-settings/${provider}`, {
      method: 'PUT',
      body: JSON.stringify({ apiKey }),
    });
  }
}

export const settingsApiAdapter = new HttpSettingsApiAdapter();
