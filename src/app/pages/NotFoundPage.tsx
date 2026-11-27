import { FileQuestion } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button, Card, CardContent } from '@/shared/ui';

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="max-w-md text-center">
        <CardContent className="space-y-4 p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[var(--muted-foreground)]">
            <FileQuestion className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[var(--muted-foreground)]">404</p>
            <h1 className="text-xl font-bold text-[var(--foreground)]">Page introuvable</h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              La page demandée n&apos;existe pas ou a été déplacée.
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
