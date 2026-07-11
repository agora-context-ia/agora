import { useState } from 'react';
import { useAuthStore } from '@/features/auth/application/use-auth';
import { ApiError } from '@/lib/api';
import { settingsApiAdapter } from '../infra/http-settings-api.adapter';

/** Saves profile changes and refreshes the auth store user. */
export function useUpdateProfile() {
  const setUser = useAuthStore((state) => state.setUser);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = async (fullName: string): Promise<boolean> => {
    setIsSaving(true);
    setError(null);
    try {
      const user = await settingsApiAdapter.updateProfile(fullName);
      setUser(user);
      return true;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error inesperado, intenta de nuevo');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return { updateProfile, isSaving, error };
}
