import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';
import type { HTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

const alertVariants = cva('flex gap-3 rounded-lg border p-4 text-sm', {
  variants: {
    variant: {
      info: 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200',
      success:
        'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200',
      warning:
        'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
      danger:
        'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200',
    },
  },
  defaultVariants: {
    variant: 'info',
  },
});

const ALERT_ICONS = {
  info: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
  danger: AlertCircle,
} as const;

export interface AlertProps
  extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
  title?: string;
}

export function Alert({ className, variant = 'info', title, children, ...props }: AlertProps) {
  const resolvedVariant = variant ?? 'info';
  const Icon = ALERT_ICONS[resolvedVariant];

  return (
    <div
      role={resolvedVariant === 'danger' ? 'alert' : 'status'}
      className={cn(alertVariants({ variant: resolvedVariant }), className)}
      {...props}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  );
}
