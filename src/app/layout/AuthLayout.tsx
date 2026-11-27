import { Building2, Moon, Sun } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/shared/ui';
import { useTheme } from '../providers/ThemeProvider';

export function AuthLayout({ children }: { children: ReactNode }) {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--foreground)]">
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)]">
            <Building2 className="h-5 w-5" aria-hidden="true" />
          </div>
          <span className="text-lg font-bold tracking-tight">SIRH</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label={resolvedTheme === 'dark' ? 'Passer au thème clair' : 'Passer au thème sombre'}
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Moon className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">{children}</div>
      </main>
      <footer className="py-4 text-center text-xs text-[var(--muted-foreground)]">
        SIRH — Système d&apos;Information des Ressources Humaines
      </footer>
    </div>
  );
}
