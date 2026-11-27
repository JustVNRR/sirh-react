import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  Bell,
  Building2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  Moon,
  Shield,
  Sun,
  UserCircle2,
  X,
} from 'lucide-react';
import { useState, type ComponentType, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui';
import { useTheme } from '../providers/ThemeProvider';

export interface NavItem {
  label: string;
  to: string;
  icon: ComponentType<{ className?: string }>;
  requiredPermissions?: string[];
  badgeCount?: number;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export interface AppShellUser {
  email: string;
  roles: readonly { code: string; name: string }[];
  unreadNotificationsCount: number;
}

export interface AppShellProps {
  sections: NavSection[];
  user: AppShellUser;
  onLogout: () => void;
  onLogoutAll: () => void;
  children: ReactNode;
}

function SidebarNav({
  sections,
  collapsed,
  onNavigate,
}: {
  sections: NavSection[];
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Navigation principale" className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      {sections.map((section) => (
        <div key={section.title} className="space-y-1">
          {!collapsed && (
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              {section.title}
            </p>
          )}
          <ul className="space-y-1">
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={onNavigate}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                          : 'text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]',
                        collapsed && 'justify-center px-2',
                      )
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                    {!collapsed && item.badgeCount !== undefined && item.badgeCount > 0 && (
                      <span className="rounded-full bg-rose-600 px-2 py-0.5 text-xs font-semibold text-white tabular-nums">
                        {item.badgeCount}
                      </span>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AppShell({ sections, user, onLogout, onLogoutAll, children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--foreground)]">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden border-r border-[var(--border)] bg-[var(--surface)] transition-all duration-200 lg:flex lg:flex-col',
          collapsed ? 'w-[72px]' : 'w-64',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-[var(--border)] px-4">
          <Link to="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)]">
              <Building2 className="h-4 w-4" aria-hidden="true" />
            </div>
            {!collapsed && <span className="font-bold tracking-tight">SIRH</span>}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label={collapsed ? 'Déplier le menu' : 'Replier le menu'}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        </div>
        <SidebarNav sections={sections} collapsed={collapsed} />
      </aside>

      {/* Mobile Drawer */}
      <DialogPrimitive.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden" />
          <DialogPrimitive.Content
            aria-label="Menu de navigation"
            className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-[var(--border)] bg-[var(--surface)] lg:hidden"
          >
            <div className="flex h-16 items-center justify-between border-b border-[var(--border)] px-4">
              <DialogPrimitive.Title className="flex items-center gap-2 font-bold">
                <Building2 className="h-5 w-5 text-[var(--primary)]" aria-hidden="true" />
                <span>SIRH</span>
              </DialogPrimitive.Title>
              <DialogPrimitive.Close asChild>
                <Button variant="ghost" size="icon" aria-label="Fermer le menu">
                  <X className="h-4 w-4" aria-hidden="true" />
                </Button>
              </DialogPrimitive.Close>
            </div>
            <SidebarNav
              sections={sections}
              collapsed={false}
              onNavigate={() => setMobileOpen(false)}
            />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      {/* Main Content */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)]/95 px-4 backdrop-blur-xs sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={
                resolvedTheme === 'dark' ? 'Passer au thème clair' : 'Passer au thème sombre'
              }
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Moon className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>

            <Button variant="ghost" size="icon" asChild>
              <Link
                to="/notifications"
                aria-label={`Notifications (${user.unreadNotificationsCount} non lues)`}
                className="relative"
              >
                <Bell className="h-4 w-4" aria-hidden="true" />
                {user.unreadNotificationsCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white tabular-nums">
                    {user.unreadNotificationsCount > 99 ? '99+' : user.unreadNotificationsCount}
                  </span>
                )}
              </Link>
            </Button>

            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <UserCircle2 className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden max-w-[180px] truncate sm:inline">{user.email}</span>
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  sideOffset={8}
                  className="z-50 min-w-56 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-lg"
                >
                  <div className="px-2.5 py-2">
                    <p className="truncate text-sm font-medium text-[var(--foreground)]">
                      {user.email}
                    </p>
                    <p className="truncate text-xs text-[var(--muted-foreground)]">
                      {user.roles.map((r) => r.name).join(', ') || 'Aucun rôle'}
                    </p>
                  </div>
                  <DropdownMenu.Separator className="my-1 h-px bg-[var(--border)]" />
                  <DropdownMenu.Item asChild>
                    <Link
                      to="/account/security"
                      className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-[var(--foreground)] outline-none hover:bg-[var(--surface-muted)] focus:bg-[var(--surface-muted)]"
                    >
                      <Shield className="h-4 w-4" aria-hidden="true" />
                      Sécurité du compte
                    </Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    onSelect={onLogout}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-[var(--foreground)] outline-none hover:bg-[var(--surface-muted)] focus:bg-[var(--surface-muted)]"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    Se déconnecter
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    onSelect={onLogoutAll}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-[var(--danger)] outline-none hover:bg-rose-50 focus:bg-rose-50 dark:hover:bg-rose-950/40 dark:focus:bg-rose-950/40"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    Déconnecter tous les appareils
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
