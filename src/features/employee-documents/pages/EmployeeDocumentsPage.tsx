import { PageHeader } from '@/shared/ui';
import { EmployeeDocumentsPanel } from '../components/EmployeeDocumentsPanel';

export function EmployeeDocumentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dossiers salariés"
        description="Coffre-fort documentaire chiffré, suivi des attestations RQTH et des titres de séjour."
      />
      <EmployeeDocumentsPanel />
    </div>
  );
}
