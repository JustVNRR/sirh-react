import { Check, Circle } from 'lucide-react';
import { PASSWORD_RULES } from '../schemas/authSchemas';

export function PasswordRequirements({ password }: { password: string }) {
  return (
    <ul
      aria-label="Critères de complexité du mot de passe"
      className="space-y-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-xs"
    >
      {PASSWORD_RULES.map((rule) => {
        const satisfied = rule.test(password);
        return (
          <li
            key={rule.id}
            className={
              satisfied
                ? 'flex items-center gap-2 font-medium text-[var(--success)]'
                : 'flex items-center gap-2 text-[var(--muted-foreground)]'
            }
          >
            {satisfied ? (
              <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <Circle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            )}
            <span>{rule.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
