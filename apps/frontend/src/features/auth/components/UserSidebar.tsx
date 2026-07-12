import { useState } from 'react';
import { ChevronLeft, ChevronRight, LogOut, Moon, Settings, Sun } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { OrganizationMenu } from '@/features/organizations/components/OrganizationMenu';
import { useSettingsDialog } from '@/features/settings/application/use-settings-dialog';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/use-theme';
import { useCurrentUser } from '../application/use-current-user';
import { useLogout } from '../application/use-logout';

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

/** Left sidebar: organization menu, projects, user info and settings trigger. */
export function UserSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useCurrentUser();
  const { logout, isLoggingOut } = useLogout();
  const { theme, toggleTheme } = useTheme();
  const openSettings = useSettingsDialog((state) => state.open);

  return (
    <aside
      className={cn(
        'flex h-full shrink-0 flex-col border-r bg-background transition-[width] duration-200',
        collapsed ? 'w-16' : 'w-56',
      )}
    >
      {/* App brand: icon-only when collapsed, icon + wordmark expanded. */}
      <div className={cn('flex items-center gap-2 border-b p-3', collapsed && 'justify-center')}>
        <img src="/assets/agora-icon.png" alt="Ágora" className="h-7 w-7 shrink-0 rounded-md" />
        {!collapsed && <span className="text-base font-semibold text-foreground">Ágora</span>}
      </div>

      <div
        className={cn(
          'flex border-b p-3',
          collapsed ? 'flex-col items-center gap-2' : 'items-center justify-between gap-2',
        )}
      >
        <div className={cn('flex min-w-0 items-center gap-2', collapsed && 'flex-col')}>
          <Avatar className="h-9 w-9">
            <AvatarFallback>{user ? getInitials(user.name) : '··'}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{user?.name ?? 'Cargando…'}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => setCollapsed((value) => !value)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          <span className="sr-only">{collapsed ? 'Expandir panel' : 'Colapsar panel'}</span>
        </Button>
      </div>

      <nav className={cn('flex-1 overflow-y-auto p-2', collapsed && 'flex flex-col items-center')}>
        <OrganizationMenu collapsed={collapsed} onRequestExpand={() => setCollapsed(false)} />
      </nav>

      <div className={cn('flex border-t p-3', collapsed ? 'flex-col gap-1' : 'flex-col gap-1')}>
        <Button
          variant="ghost"
          onClick={() => openSettings()}
          className={cn('w-full text-muted-foreground', collapsed ? 'justify-center px-0' : 'justify-start gap-2')}
        >
          <Settings className="h-4 w-4" />
          {!collapsed && <span>Configuración</span>}
        </Button>

        <Button
          variant="ghost"
          onClick={toggleTheme}
          className={cn('w-full text-muted-foreground', collapsed ? 'justify-center px-0' : 'justify-start gap-2')}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {!collapsed && <span>{theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span>}
        </Button>

        <Button
          variant="ghost"
          disabled={isLoggingOut}
          onClick={logout}
          className={cn('w-full text-muted-foreground', collapsed ? 'justify-center px-0' : 'justify-start gap-2')}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Cerrar sesión</span>}
        </Button>
      </div>
    </aside>
  );
}
