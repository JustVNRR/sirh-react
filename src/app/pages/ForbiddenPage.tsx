import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button, Card, CardContent } from '@/shared/ui';

export function ForbiddenPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="max-w-md text-center">
        <CardContent className="space-y-4 p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-[var(--danger)] dark:bg-rose-950/50">
            <ShieldAlert className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[var(--danger)]">403 — Accès refusé</p>
            <h1 className="text-xl font-bold text-[var(--foreground)]">
              Permissions insuffisantes
            </h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Vous ne disposez pas des droits nécessaires pour consulter cette ressource.
            </p>
          </div>
          <Button asChild>
            <Link to="/dashboard">Retour au tableau de bord</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
