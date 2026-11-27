import { useAuth } from '@/shared/auth/AuthContext';
import { Alert } from '@/shared/ui';
import { EmployeeDetailView } from './EmployeeDetailPage';

export function MySpacePage() {
  const { user } = useAuth();

  if (!user?.employeeId) {
    return (
      <Alert variant="warning" title="Profil collaborateur non rattaché">
        Votre compte utilisateur n&apos;est associé à aucune fiche collaborateur.
      </Alert>
    );
  }

  return <EmployeeDetailView employeeId={user.employeeId} />;
}
