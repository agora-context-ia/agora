import { useState } from 'react';
import { ApiError } from '@/lib/api';
import { organizationApiAdapter } from '../infra/http-organization-api.adapter';
import { useOrganizationStore } from './use-active-organization';

export function useCreateOrganization() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addOrganization = useOrganizationStore((state) => state.addOrganization);

  const createOrganization = async (name: string): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    try {
      const organization = await organizationApiAdapter.create({ name });
      // Queda como organización activa (addOrganization setea el id activo).
      addOrganization(organization);
      return true;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo conectar con el servidor');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { createOrganization, isSubmitting, error };
}
