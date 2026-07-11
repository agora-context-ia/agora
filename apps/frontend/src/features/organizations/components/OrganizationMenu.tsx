import { useState } from 'react';
import { Building2, Check, ChevronDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useOrganizationList } from '../application/use-organization-list';
import { useActiveOrganization, useOrganizationStore } from '../application/use-active-organization';
import { CreateOrganizationDialog } from './CreateOrganizationDialog';

const roleLabel: Record<string, string> = {
  owner: 'Dueño',
  admin: 'Admin',
  member: 'Miembro',
};

interface OrganizationMenuProps {
  collapsed: boolean;
  onRequestExpand: () => void;
}

/**
 * Organization accordion menu for the left sidebar. When the sidebar is
 * collapsed only the icon remains: clicking expands the sidebar and
 * opens the menu.
 */
export function OrganizationMenu({ collapsed, onRequestExpand }: OrganizationMenuProps) {
  const [open, setOpen] = useState(true);
  const { organizations, isLoading } = useOrganizationList();
  const activeOrganization = useActiveOrganization();
  const setActiveOrganization = useOrganizationStore((state) => state.setActiveOrganization);

  if (collapsed) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={() => {
          onRequestExpand();
          setOpen(true);
        }}
      >
        <Building2 className="h-4 w-4" />
        <span className="sr-only">Organizaciones</span>
      </Button>
    );
  }

  return (
    <div>
      <Button
        variant="ghost"
        className="w-full justify-between gap-2 px-2 font-normal"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="flex min-w-0 items-center gap-2">
          <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm font-medium">Organizaciones</span>
        </span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', !open && '-rotate-90')}
        />
      </Button>

      {open && (
        <div className="mt-1 flex flex-col gap-0.5 pl-2">
          {isLoading && organizations.length === 0 && (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">Cargando…</p>
          )}
          {organizations.map((organization) => {
            const isActive = organization.id === activeOrganization?.id;
            return (
              <button
                key={organization.id}
                type="button"
                onClick={() => setActiveOrganization(organization.id)}
                className={cn(
                  'flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent',
                  isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
                )}
              >
                <span className="flex min-w-0 flex-col">
                  <span className="truncate">{organization.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {roleLabel[organization.role] ?? organization.role}
                  </span>
                </span>
                {isActive && <Check className="h-4 w-4 shrink-0" />}
              </button>
            );
          })}
          <CreateOrganizationDialog
            trigger={
              <button
                type="button"
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-accent"
              >
                <Plus className="h-4 w-4 shrink-0" />
                Crear organización
              </button>
            }
          />
        </div>
      )}
    </div>
  );
}
