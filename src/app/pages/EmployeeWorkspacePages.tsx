import { useParams } from 'react-router-dom';
import { PositionJobSheetBar } from '@/features/contracts';
import { EmployeeDocumentsPanel } from '@/features/employee-documents';
import { EmployeeDetailView, type PositionDto } from '@/features/employees';
import { useAuth, usePermission } from '@/shared/auth/AuthContext';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { Alert } from '@/shared/ui';

function useEmployeeWorkspaceSlots(employeeId: string) {
  const { user } = useAuth();
  const { can } = usePermission();

  const isSelf = user?.employeeId === employeeId;
  const canReadJobSheet =
    (isSelf && can(PERMISSIONS.JOBSHEETS_READ_SELF)) ||
    can(PERMISSIONS.JOBSHEETS_READ_TEAM) ||
    can(PERMISSIONS.JOBSHEETS_READ_ALL);
  const canWriteJobSheet = can(PERMISSIONS.JOBSHEETS_WRITE);

  const canReadDocs =
    (isSelf && can(PERMISSIONS.EMPLOYEE_DOCS_READ_SELF)) ||
    can(PERMISSIONS.EMPLOYEE_DOCS_READ_TEAM) ||
    can(PERMISSIONS.EMPLOYEE_DOCS_READ_ALL);

  const renderPositionExtra = (position: PositionDto) => (
    <PositionJobSheetBar
      positionId={position.id}
      positionTitle={position.jobTitle}
      canRead={canReadJobSheet}
      canWrite={canWriteJobSheet}
    />
  );

  const extraTabs = canReadDocs
    ? [
        {
          value: 'documents',
          label: 'Dossier administratif',
          content: <EmployeeDocumentsPanel fixedEmployeeId={employeeId} />,
        },
      ]
    : [];

  return { renderPositionExtra, extraTabs };
}

export function EmployeeProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { renderPositionExtra, extraTabs } = useEmployeeWorkspaceSlots(id ?? '');

  if (!id) {
    return null;
  }

  return (
    <EmployeeDetailView
      employeeId={id}
      renderPositionExtra={renderPositionExtra}
      extraTabs={extraTabs}
    />
  );
}

export function MyProfilePage() {
  const { user } = useAuth();
  const employeeId = user?.employeeId ?? '';
  const { renderPositionExtra, extraTabs } = useEmployeeWorkspaceSlots(employeeId);

  if (!employeeId) {
    return (
      <Alert variant="warning" title="Profil collaborateur non rattaché">
        Votre compte utilisateur n&apos;est associé à aucune fiche collaborateur.
      </Alert>
    );
  }

  return (
    <EmployeeDetailView
      employeeId={employeeId}
      renderPositionExtra={renderPositionExtra}
      extraTabs={extraTabs}
    />
  );
}
