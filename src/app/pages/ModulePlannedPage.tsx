import { Construction } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button, EmptyState, PageHeader } from '@/shared/ui';

export function ModulePlannedPage({ title, sprint }: { title: string; sprint: string }) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={`Module planifié pour le ${sprint}.`} />
      <EmptyState
        icon={<Construction className="h-6 w-6" aria-hidden="true" />}
        title={`${title} — À venir (${sprint})`}
        description="Cette section est déjà protégée par vos permissions RBAC et sera livrée dans le sprint dédié."
        action={
          <Button asChild variant="outline">
            <Link to="/dashboard">Retour au tableau de bord</Link>
          </Button>
        }
      />
    </div>
  );
}
