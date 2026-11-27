import { RefreshCw } from 'lucide-react';
import { Alert } from './Alert';
import { Button } from './Button';

export interface ConcurrencyConflictBannerProps {
  message?: string;
  onReload: () => void;
  isReloading?: boolean;
}

export function ConcurrencyConflictBanner({
  message = 'Cet enregistrement a été modifié par un autre utilisateur. Rechargez les dernières données avant de réessayer.',
  onReload,
  isReloading = false,
}: ConcurrencyConflictBannerProps) {
  return (
    <Alert variant="warning" title="Conflit de modification (409)">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>{message}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={onReload}
          isLoading={isReloading}
          className="shrink-0"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          Recharger les données
        </Button>
      </div>
    </Alert>
  );
}
