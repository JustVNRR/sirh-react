import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Plus, Power } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ApiError } from '@/shared/api/types';
import { usePermission } from '@/shared/auth/AuthContext';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { Badge, Button, ConfirmDialog, DataTable, Input, PageHeader, Select } from '@/shared/ui';
import { organizationApi } from '../api/organizationApi';
import { CompanyFormDialog } from '../components/CompanyFormDialog';
import { useCompaniesQuery, useUpdateCompanyStatusMutation } from '../hooks/useOrganizationQueries';
import type { CompanyDto } from '../types/organizationTypes';

export function CompaniesPage() {
  const { can } = usePermission();
  const canWrite = can(PERMISSIONS.COMPANIES_WRITE);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'true' | 'false'>('all');
  const debouncedSearch = useDebounce(searchInput, 300);

  const activeParam = activeFilter === 'all' ? undefined : activeFilter === 'true';
  const query = useCompaniesQuery({
    active: activeParam,
    search: debouncedSearch || undefined,
    page,
    pageSize: 20,
  });

  const statusMutation = useUpdateCompanyStatusMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyDto | null>(null);
  const [statusTarget, setStatusTarget] = useState<CompanyDto | null>(null);

  const handleConfirmStatus = async () => {
    if (!statusTarget) {
      return;
    }
    try {
      await statusMutation.mutateAsync({
        id: statusTarget.id,
        payload: { isActive: !statusTarget.isActive, rowVersion: statusTarget.rowVersion },
      });
      toast.success(statusTarget.isActive ? 'Entreprise désactivée.' : 'Entreprise réactivée.');
      setStatusTarget(null);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : 'Impossible de modifier le statut.');
    }
  };

  const columns: ColumnDef<CompanyDto, unknown>[] = [
    {
      accessorKey: 'name',
      header: 'Entreprise',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-[var(--foreground)]">{row.original.name}</p>
          <p className="text-xs text-[var(--muted-foreground)]">
            {row.original.legalForm ?? '—'} · {row.original.city ?? '—'}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'siret',
      header: 'SIRET',
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.siret}</span>,
    },
    {
      accessorKey: 'collectiveAgreement',
      header: 'Convention',
    },
    {
      accessorKey: 'isActive',
      header: 'Statut',
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'success' : 'neutral'}>
          {row.original.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    ...(canWrite
      ? [
          {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }: { row: { original: CompanyDto } }) => (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedCompany(row.original);
                    setDialogOpen(true);
                  }}
                  aria-label={`Modifier ${row.original.name}`}
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStatusTarget(row.original)}
                  aria-label={
                    row.original.isActive
                      ? `Désactiver ${row.original.name}`
                      : `Activer ${row.original.name}`
                  }
                >
                  <Power className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            ),
          } satisfies ColumnDef<CompanyDto, unknown>,
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Entreprises"
        description="Référentiel des entités juridiques du groupe."
        actions={
          canWrite && (
            <Button
              onClick={() => {
                setSelectedCompany(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nouvelle entreprise
            </Button>
          )
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          aria-label="Rechercher une entreprise"
          placeholder="Rechercher par nom, SIRET ou ville..."
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
            setPage(1);
          }}
          className="sm:max-w-xs"
        />
        <Select
          aria-label="Filtrer par statut"
          value={activeFilter}
          onChange={(e) => {
            setActiveFilter(e.target.value as 'all' | 'true' | 'false');
            setPage(1);
          }}
          className="sm:max-w-48"
        >
          <option value="all">Toutes</option>
          <option value="true">Actives uniquement</option>
          <option value="false">Inactives uniquement</option>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={query.data?.items ?? []}
        page={query.data?.page ?? page}
        pageSize={query.data?.pageSize ?? 20}
        totalCount={query.data?.totalCount ?? 0}
        totalPages={query.data?.totalPages ?? 1}
        onPageChange={setPage}
        isLoading={query.isLoading}
        errorMessage={query.error instanceof ApiError ? query.error.detail : undefined}
        emptyTitle="Aucune entreprise"
        emptyDescription="Aucune entreprise ne correspond à votre recherche."
      />

      <CompanyFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        company={selectedCompany}
        onReloadRequired={async () => {
          if (!selectedCompany) {
            return null;
          }
          const fresh = await organizationApi.getCompanyById(selectedCompany.id);
          setSelectedCompany(fresh);
          return fresh;
        }}
      />

      <ConfirmDialog
        open={Boolean(statusTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setStatusTarget(null);
          }
        }}
        title={
          statusTarget?.isActive
            ? `Désactiver ${statusTarget.name} ?`
            : `Réactiver ${statusTarget?.name ?? ''} ?`
        }
        description={
          statusTarget?.isActive
            ? 'Cette entreprise ne sera plus proposée pour de nouvelles affectations.'
            : 'Cette entreprise redeviendra active dans le référentiel.'
        }
        confirmLabel={statusTarget?.isActive ? 'Désactiver' : 'Réactiver'}
        variant={statusTarget?.isActive ? 'destructive' : 'primary'}
        isLoading={statusMutation.isPending}
        onConfirm={() => void handleConfirmStatus()}
      />
    </div>
  );
}
