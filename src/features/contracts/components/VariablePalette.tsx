import { Code2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Spinner } from '@/shared/ui';
import { useTemplateVariablesQuery } from '../hooks/useContractModelsQueries';
import type { TemplateVariableDto } from '../types/contractTypes';

export interface VariablePaletteProps {
  customVariables: string[];
  disabled?: boolean;
  onInsert: (variableKey: string) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  employee: 'Collaborateur',
  company: 'Entreprise',
  position: 'Poste',
  contract: 'Contrat',
};

function groupVariables(variables: TemplateVariableDto[]): Record<string, TemplateVariableDto[]> {
  const grouped: Record<string, TemplateVariableDto[]> = {};
  for (const variable of variables) {
    const bucket = grouped[variable.category] ?? [];
    bucket.push(variable);
    grouped[variable.category] = bucket;
  }
  return grouped;
}

export function VariablePalette({
  customVariables,
  disabled = false,
  onInsert,
}: VariablePaletteProps) {
  const variablesQuery = useTemplateVariablesQuery();
  const grouped = groupVariables(variablesQuery.data ?? []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Code2 className="h-4 w-4 text-[var(--primary)]" aria-hidden="true" />
          Variables Scriban
        </CardTitle>
        <CardDescription>
          Cliquez sur une variable pour insérer <code className="text-xs">{'{{ variable }}'}</code>{' '}
          dans le modèle.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {variablesQuery.isLoading && <Spinner label="Chargement des variables..." />}

        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
              {CATEGORY_LABELS[category.toLowerCase()] ?? category}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {items.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  disabled={disabled}
                  title={item.description}
                  onClick={() => onInsert(item.key)}
                  className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-1 text-left text-xs font-mono text-[var(--foreground)] transition-colors hover:border-[var(--primary)] hover:bg-indigo-50/50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-indigo-950/30 cursor-pointer"
                >
                  {item.key}
                </button>
              ))}
            </div>
          </div>
        ))}

        {customVariables.length > 0 && (
          <div className="space-y-1.5 border-t border-[var(--border)] pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
              Variables personnalisées
            </p>
            <div className="flex flex-wrap gap-1.5">
              {customVariables.map((key) => {
                const fullKey = key.startsWith('custom.') ? key : `custom.${key}`;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={disabled}
                    onClick={() => onInsert(fullKey)}
                    className="rounded-md border border-indigo-200 bg-indigo-50/60 px-2 py-1 text-xs font-mono text-indigo-700 transition-colors hover:border-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-50 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300 cursor-pointer"
                  >
                    {fullKey}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
