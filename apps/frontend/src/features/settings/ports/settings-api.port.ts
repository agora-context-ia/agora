import type { User } from '@/features/auth/domain/user';
import type { AiProviderSetting } from '../domain/settings';

/** API client contract for the settings feature. */
export interface SettingsApiPort {
  updateProfile(fullName: string): Promise<User>;
  listAiProviders(organizationId: string): Promise<AiProviderSetting[]>;
  saveAiProviderKey(organizationId: string, provider: string, apiKey: string): Promise<void>;
}
