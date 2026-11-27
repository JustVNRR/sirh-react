import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { Label } from './Label';

export interface FormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}

export function FormField({
  id,
  label,
  required = false,
  error,
  hint,
  className,
  children,
}: FormFieldProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={id}>
        {label}
        {required && (
          <span className="ml-1 text-[var(--danger)]" aria-hidden="true">
            *
          </span>
        )}
      </Label>
      {children}
      {hint && !error && (
        <p id={hintId} className="text-xs text-[var(--muted-foreground)]">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-[var(--danger)]">
          {error}
        </p>
      )}
    </div>
  );
}
