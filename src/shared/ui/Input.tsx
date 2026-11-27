import type { InputHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export function Input({ className, hasError = false, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'flex h-10 w-full rounded-lg border bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] disabled:cursor-not-allowed disabled:opacity-50',
        hasError ? 'border-[var(--danger)]' : 'border-[var(--border)]',
        className,
      )}
      aria-invalid={hasError || undefined}
      {...props}
    />
  );
}
