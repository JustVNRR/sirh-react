import type { SelectHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}

export function Select({ className, hasError = false, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        'flex h-10 w-full rounded-lg border bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50',
        hasError ? 'border-[var(--danger)]' : 'border-[var(--border)]',
        className,
      )}
      aria-invalid={hasError || undefined}
      {...props}
    >
      {children}
    </select>
  );
}
