import { useEffect } from 'react';
import { organizationApiAdapter } from '../infra/http-organization-api.adapter';
import { useOrganizationStore } from './use-active-organization';

/** Loads the user's organizations once and exposes them with loading state. */
export function useOrganizationList() {
  const organizations = useOrganizationStore((state) => state.organizations);
  const isLoading = useOrganizationStore((state) => state.isLoading);
  const hasLoaded = useOrganizationStore((state) => state.hasLoaded);
  const setOrganizations = useOrganizationStore((state) => state.setOrganizations);
  const setLoading = useOrganizationStore((state) => state.setLoading);

  useEffect(() => {
    if (hasLoaded) return;

    let cancelled = false;
    setLoading(true);

    organizationApiAdapter
      .list()
      .then((result) => {
        if (cancelled) return;
        setOrganizations(result);
      })
      .catch(() => {
        if (cancelled) return;
        setOrganizations([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hasLoaded, setLoading, setOrganizations]);

  return { organizations, isLoading, hasLoaded };
}
