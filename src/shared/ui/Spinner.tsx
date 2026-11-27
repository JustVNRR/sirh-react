import { Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

export interface SpinnerProps {
  className?: string;
  label?: string;
}

export function Spinner({ className, label = 'Chargement...' }: SpinnerProps) {
  return (
    <div
      role="status"
      className={cn(
        'inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)]',
        className,
      )}
    >
      <Loader2 className="h-4 w-4 animate-spin text-[var(--primary)]" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
