import { ArrowLeft, Pencil, Power } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useDepartmentsQuery } from '@/features/organization';
import { ApiError } from '@/shared/api/types';
import { useAuth, usePermission } from '@/shared/auth/AuthContext';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { formatDateFr } from '@/shared/lib/format';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  PageHeader,
  Spinner,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/ui';
import {
  useActivateEmployeeMutation,
  useDeactivateEmployeeMutation,
  useEmployeeDetailQuery,
} from '../hooks/useEmployeesQueries';
import { PRIVILEGED_ROLES } from '../schemas/employeeSchemas';

function MaskedOrValue({ value }: { value: string | null | undefined }) {
  if (value === null) {
    return <span className="italic text-[var(--muted-foreground)]">Masqué (confidentiel)</span>;
  }
  return <span>{value || '—'}</span>;
}

function EmployeeProfileCards({
  bornAt,
  birthPlace,
  nationalId,
  email,
  mobile,
  personalEmail,
  personalMobile,
}: {
  bornAt: string | null;
  birthPlace: string | null;
  nationalId: string | null;
  email: string;
  mobile: string | null;
  personalEmail: string | null;
  personalMobile: string | null;
}) {
  const birthCitySuffix = birthPlace ? ` à ${birthPlace}` : '';
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>État civil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="font-medium text-[var(--muted-foreground)]">Naissance : </span>
            {formatDateFr(bornAt)}
            {birthCitySuffix}
          </p>
          <p>
            <span className="font-medium text-[var(--muted-foreground)]">NIR : </span>
            <MaskedOrValue value={nationalId} />
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Coordonnées</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="font-medium text-[var(--muted-foreground)]">Email pro : </span>
            {email}
          </p>
          <p>
            <span className="font-medium text-[var(--muted-foreground)]">Mobile pro : </span>
            {mobile ?? '—'}
          </p>
          <p>
            <span className="font-medium text-[var(--muted-foreground)]">Email perso : </span>
            <MaskedOrValue value={personalEmail} />
          </p>
          <p>
            <span className="font-medium text-[var(--muted-foreground)]">Mobile perso : </span>
            <MaskedOrValue value={personalMobile} />
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function EmployeeDetailView({ employeeId }: { employeeId: string }) {
  const { user } = useAuth();
  const { can } = usePermission();
  const detailQuery = useEmployeeDetailQuery(employeeId);
  const departmentsQuery = useDepartmentsQuery();
  const deactivateMutation = useDeactivateEmployeeMutation();
  const activateMutation = useActivateEmployeeMutation();

  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false);

  if (detailQuery.isLoading) {
    return <Spinner label="Chargement du profil collaborateur..." />;
  }

  if (detailQuery.error) {
    const msg =
      detailQuery.error instanceof ApiError
        ? detailQuery.error.detail
        : 'Impossible de charger ce profil.';
    return (
      <Alert variant="danger" title="Accès impossible">
        {msg}
      </Alert>
    );
  }

  const employee = detailQuery.data;
  if (!employee) {
    return null;
  }

  const isSelf = user?.employeeId === employee.id;
  const targetsPrivileged = employee.roles.some((r) => PRIVILEGED_ROLES.includes(r));
  const canWriteEmployee =
    can(PERMISSIONS.EMPLOYEES_WRITE) &&
    (!targetsPrivileged || can(PERMISSIONS.EMPLOYEES_MANAGE_PRIVILEGED));

  const showEmergencyContacts =
    (isSelf && can(PERMISSIONS.EMERGENCY_CONTACTS_READ_SELF)) ||
    can(PERMISSIONS.EMERGENCY_CONTACTS_READ_ALL);

  const deptMap = new Map((departmentsQuery.data ?? []).map((d) => [d.code, d.label]));

  const handleToggleActive = async () => {
    try {
      if (employee.isActive) {
        await deactivateMutation.mutateAsync(employee.id);
        toast.success('Collaborateur désactivé et sessions révoquées.');
      } else {
        await activateMutation.mutateAsync(employee.id);
        toast.success('Collaborateur réactivé.');
      }
      setStatusConfirmOpen(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : 'Opération impossible.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${employee.honorific} ${employee.firstName} ${employee.lastName}`}
        description={`${employee.email} · ${employee.slug}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {can(PERMISSIONS.EMPLOYEES_READ_ALL) && (
              <Button variant="outline" asChild>
                <Link to="/employees">
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Annuaire
                </Link>
              </Button>
            )}
            {canWriteEmployee && (
              <>
                <Button variant="outline" asChild>
                  <Link to={`/employees/${employee.id}/edit`}>
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                    Modifier
                  </Link>
                </Button>
                <Button
                  variant={employee.isActive ? 'destructive' : 'primary'}
                  onClick={() => setStatusConfirmOpen(true)}
                >
                  <Power className="h-4 w-4" aria-hidden="true" />
                  {employee.isActive ? 'Désactiver' : 'Réactiver'}
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={employee.isActive ? 'success' : 'danger'}>
          {employee.isActive ? 'Compte actif' : 'Désactivé'}
        </Badge>
        {employee.currentlyInPosition && <Badge variant="info">En poste</Badge>}
        {employee.roles.map((r) => (
          <Badge key={r} variant="primary">
            {r}
          </Badge>
        ))}
        {employee.departments.map((d) => (
          <Badge key={d} variant="neutral">
            {deptMap.get(d) ?? d}
          </Badge>
        ))}
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profil &amp; Coordonnées</TabsTrigger>
          {showEmergencyContacts && (
            <TabsTrigger value="emergency-contacts">Contacts d&apos;urgence</TabsTrigger>
          )}
          <TabsTrigger value="positions">Postes &amp; Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <EmployeeProfileCards
            bornAt={employee.bornAt}
            birthPlace={employee.birthPlace}
            nationalId={employee.nationalId}
            email={employee.email}
            mobile={employee.mobile}
            personalEmail={employee.personalEmail}
            personalMobile={employee.personalMobile}
          />
        </TabsContent>

        {showEmergencyContacts && (
          <TabsContent value="emergency-contacts">
            <Card>
              <CardContent className="p-6 text-sm text-[var(--muted-foreground)]">
                Contacts d&apos;urgence en cours de déploiement (F3.2).
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="positions">
          <Card>
            <CardContent className="p-6 text-sm text-[var(--muted-foreground)]">
              Historique des postes en cours de déploiement (F3.2).
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={statusConfirmOpen}
        onOpenChange={setStatusConfirmOpen}
        title={
          employee.isActive
            ? `Désactiver ${employee.firstName} ${employee.lastName} ?`
            : `Réactiver ${employee.firstName} ${employee.lastName} ?`
        }
        description={
          employee.isActive
            ? 'Le collaborateur ne pourra plus se connecter et ses jetons de session seront immédiatement révoqués.'
            : 'Le compte collaborateur sera réactivé.'
        }
        confirmLabel={employee.isActive ? 'Désactiver' : 'Réactiver'}
        variant={employee.isActive ? 'destructive' : 'primary'}
        isLoading={deactivateMutation.isPending || activateMutation.isPending}
        onConfirm={() => void handleToggleActive()}
      />
    </div>
  );
}

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) {
    return null;
  }
  return <EmployeeDetailView employeeId={id} />;
}
