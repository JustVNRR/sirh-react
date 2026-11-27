import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center',
        className,
      )}
    >
      {icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[var(--muted-foreground)]">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-[var(--foreground)]">{title}</h3>
      {description && (
        <p className="mt-1 max-w-md text-sm text-[var(--muted-foreground)]">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
