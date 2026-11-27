import { Mail, Pencil, Plus, ShieldAlert, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useCompaniesQuery } from '@/features/organization';
import { ApiError } from '@/shared/api/types';
import { usePermission } from '@/shared/auth/AuthContext';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { useDebounce } from '@/shared/hooks/useDebounce';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  Checkbox,
  ConfirmDialog,
  EmptyState,
  Input,
  PageHeader,
  Select,
  Spinner,
} from '@/shared/ui';
import { StaffRepresentativeFormDialog } from '../components/StaffRepresentativeFormDialog';
import {
  useDeleteStaffRepresentativeMutation,
  useStaffRepresentativesQuery,
} from '../hooks/useCseRseQueries';
import {
  ELECTORAL_COLLEGE_LABELS,
  STAFF_REP_ROLES,
  STAFF_REP_ROLE_LABELS,
} from '../schemas/cseRseSchemas';
import type { StaffRepresentativeDto, StaffRepresentativeRole } from '../types/cseRseTypes';

export function StaffRepresentativesPage() {
  const { can } = usePermission();
  const canWrite = can(PERMISSIONS.STAFF_REPS_WRITE);

  const [search, setSearch] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [role, setRole] = useState<StaffRepresentativeRole | ''>('');
  const [harassmentOnly, setHarassmentOnly] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StaffRepresentativeDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffRepresentativeDto | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const companiesQuery = useCompaniesQuery({ page: 1, pageSize: 100 });
  const repsQuery = useStaffRepresentativesQuery({
    search: debouncedSearch || undefined,
    companyId: companyId || undefined,
    role: role || undefined,
    harassmentAdvisor: harassmentOnly ? true : undefined,
    page: 1,
    pageSize: 50,
  });
  const deleteMutation = useDeleteStaffRepresentativeMutation();

  const companyMap = new Map((companiesQuery.data?.items ?? []).map((c) => [c.id, c.name]));

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    setActionError(null);
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success('Représentant supprimé.');
      setDeleteTarget(null);
    } catch (error) {
      setActionError(
        error instanceof ApiError ? error.detail : 'Impossible de supprimer ce représentant.',
      );
      setDeleteTarget(null);
    }
  };

  const items = repsQuery.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Représentants du personnel (CSE)"
        description="Annuaire des élus CSE, délégués syndicaux et référents harcèlement."
        actions={
          canWrite && (
            <Button
              onClick={() => {
                setEditTarget(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Ajouter un représentant
            </Button>
          )
        }
      />

      <div className="grid gap-3 md:grid-cols-4">
        <Input
          aria-label="Rechercher un représentant"
          placeholder="Rechercher par nom ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Select
          aria-label="Filtrer par entreprise"
          value={companyId}
          onChange={(e) => setCompanyId(e.target.value)}
        >
          <option value="">Toutes les entreprises</option>
          {(companiesQuery.data?.items ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>

        <Select
          aria-label="Filtrer par mandat"
          value={role}
          onChange={(e) => setRole(e.target.value as StaffRepresentativeRole | '')}
        >
          <option value="">Tous les mandats</option>
          {STAFF_REP_ROLES.map((r) => (
            <option key={r} value={r}>
              {STAFF_REP_ROLE_LABELS[r]}
            </option>
          ))}
        </Select>

        <div className="flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
          <Checkbox
            id="cse-filter-harassment"
            label="Référents harcèlement uniquement"
            checked={harassmentOnly}
            onChange={(e) => setHarassmentOnly(e.target.checked)}
          />
        </div>
      </div>

      {actionError && (
        <Alert variant="danger" title="Erreur">
          {actionError}
        </Alert>
      )}

      {repsQuery.isLoading && <Spinner label="Chargement de l’annuaire CSE..." />}

      {repsQuery.error && (
        <Alert variant="danger" title="Erreur">
          {repsQuery.error instanceof ApiError
            ? repsQuery.error.detail
            : 'Impossible de charger les représentants du personnel.'}
        </Alert>
      )}

      {!repsQuery.isLoading && !repsQuery.error && items.length === 0 && (
        <EmptyState
          icon={<Users className="h-6 w-6" aria-hidden="true" />}
          title="Aucun représentant trouvé"
          description="Aucun élu ou référent ne correspond aux critères sélectionnés."
        />
      )}

      {items.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((rep) => (
            <Card key={rep.id}>
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">
                      {rep.firstName} {rep.lastName}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {companyMap.get(rep.companyId) ?? 'Entreprise'}
                    </p>
                  </div>
                  {canWrite && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Modifier ${rep.firstName} ${rep.lastName}`}
                        onClick={() => {
                          setEditTarget(rep);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Supprimer ${rep.firstName} ${rep.lastName}`}
                        onClick={() => setDeleteTarget(rep)}
                      >
                        <Trash2 className="h-4 w-4 text-[var(--danger)]" aria-hidden="true" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="primary">{STAFF_REP_ROLE_LABELS[rep.representativeRole]}</Badge>
                  <Badge variant="neutral">{ELECTORAL_COLLEGE_LABELS[rep.college]}</Badge>
                  {rep.isHarassmentAdvisor && (
                    <Badge variant="warning" className="gap-1">
                      <ShieldAlert className="h-3 w-3" aria-hidden="true" />
                      Référent harcèlement
                    </Badge>
                  )}
                </div>

                <a
                  href={`mailto:${rep.email}`}
                  className="inline-flex items-center gap-1.5 text-sm text-[var(--primary)] hover:underline"
                >
                  <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                  {rep.email}
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <StaffRepresentativeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        representative={editTarget}
        onRefreshRequested={() => {
          repsQuery.refetch().catch(() => undefined);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title={`Supprimer ${deleteTarget?.firstName ?? ''} ${deleteTarget?.lastName ?? ''} ?`}
        description="Ce représentant sera retiré de l’annuaire CSE."
        confirmLabel="Supprimer"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => void handleConfirmDelete()}
      />
    </div>
  );
}
