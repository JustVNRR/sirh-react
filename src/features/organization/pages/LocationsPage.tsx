import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ApiError } from '@/shared/api/types';
import { usePermission } from '@/shared/auth/AuthContext';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { useDebounce } from '@/shared/hooks/useDebounce';
import {
  Alert,
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  Input,
  PageHeader,
  Select,
} from '@/shared/ui';
import { organizationApi } from '../api/organizationApi';
import { LocationFormDialog } from '../components/LocationFormDialog';
import {
  useCompaniesQuery,
  useDeleteLocationMutation,
  useLocationsQuery,
} from '../hooks/useOrganizationQueries';
import type { LocationDto } from '../types/organizationTypes';

export function LocationsPage() {
  const { can } = usePermission();
  const canWrite = can(PERMISSIONS.LOCATIONS_WRITE);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [publishedFilter, setPublishedFilter] = useState<'all' | 'true' | 'false'>('all');
  const [companyFilter, setCompanyFilter] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);

  const companiesQuery = useCompaniesQuery({ page: 1, pageSize: 100 });
  const locationsQuery = useLocationsQuery({
    published: publishedFilter === 'all' ? undefined : publishedFilter === 'true',
    companyId: companyFilter || undefined,
    search: debouncedSearch || undefined,
    page,
    pageSize: 20,
  });

  const deleteMutation = useDeleteLocationMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LocationDto | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success('Lieu supprimé.');
      setDeleteTarget(null);
    } catch (error) {
      if (error instanceof ApiError) {
        setDeleteError(error.detail);
      } else {
        setDeleteError('Impossible de supprimer ce lieu.');
      }
      setDeleteTarget(null);
    }
  };

  const columns: ColumnDef<LocationDto, unknown>[] = [
    {
      accessorKey: 'name',
      header: 'Lieu',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <span
            className="h-4 w-4 shrink-0 rounded-full border border-[var(--border)]"
            style={{ backgroundColor: row.original.colorCode }}
            aria-hidden="true"
          />
          <div>
            <p className="font-medium text-[var(--foreground)]">{row.original.name}</p>
            <p className="font-mono text-xs text-[var(--muted-foreground)]">{row.original.slug}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'city',
      header: 'Ville',
      cell: ({ row }) => (
        <span>
          {row.original.postalCode ? `${row.original.postalCode} ` : ''}
          {row.original.city}
        </span>
      ),
    },
    {
      accessorKey: 'isPublished',
      header: 'Statut',
      cell: ({ row }) => (
        <Badge variant={row.original.isPublished ? 'success' : 'neutral'}>
          {row.original.isPublished ? 'Publié' : 'Brouillon'}
        </Badge>
      ),
    },
    ...(canWrite
      ? [
          {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }: { row: { original: LocationDto } }) => (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedLocation(row.original);
                    setDialogOpen(true);
                  }}
                  aria-label={`Modifier ${row.original.name}`}
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDeleteError(null);
                    setDeleteTarget(row.original);
                  }}
                  aria-label={`Supprimer ${row.original.name}`}
                >
                  <Trash2 className="h-4 w-4 text-[var(--danger)]" aria-hidden="true" />
                </Button>
              </div>
            ),
          } satisfies ColumnDef<LocationDto, unknown>,
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lieux & Établissements"
        description="Sites géographiques d'affectation des postes et initiatives RSE."
        actions={
          canWrite && (
            <Button
              onClick={() => {
                setSelectedLocation(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nouveau lieu
            </Button>
          )
        }
      />

      {deleteError && (
        <Alert variant="danger" title="Suppression impossible">
          {deleteError}
        </Alert>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          aria-label="Rechercher un lieu"
          placeholder="Rechercher par nom, ville..."
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
            setPage(1);
          }}
          className="sm:max-w-xs"
        />
        <Select
          aria-label="Filtrer par publication"
          value={publishedFilter}
          onChange={(e) => {
            setPublishedFilter(e.target.value as 'all' | 'true' | 'false');
            setPage(1);
          }}
          className="sm:max-w-48"
        >
          <option value="all">Tous les statuts</option>
          <option value="true">Publiés</option>
          <option value="false">Brouillons</option>
        </Select>
        <Select
          aria-label="Filtrer par entreprise"
          value={companyFilter}
          onChange={(e) => {
            setCompanyFilter(e.target.value);
            setPage(1);
          }}
          className="sm:max-w-56"
        >
          <option value="">Toutes les entreprises</option>
          {companiesQuery.data?.items.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={locationsQuery.data?.items ?? []}
        page={locationsQuery.data?.page ?? page}
        pageSize={locationsQuery.data?.pageSize ?? 20}
        totalCount={locationsQuery.data?.totalCount ?? 0}
        totalPages={locationsQuery.data?.totalPages ?? 1}
        onPageChange={setPage}
        isLoading={locationsQuery.isLoading}
        errorMessage={
          locationsQuery.error instanceof ApiError ? locationsQuery.error.detail : undefined
        }
        emptyTitle="Aucun lieu"
        emptyDescription="Aucun établissement ne correspond à vos filtres."
      />

      <LocationFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        location={selectedLocation}
        onReloadRequired={async () => {
          if (!selectedLocation) {
            return null;
          }
          const fresh = await organizationApi.getLocationById(selectedLocation.id);
          setSelectedLocation(fresh);
          return fresh;
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title={`Supprimer ${deleteTarget?.name ?? ''} ?`}
        description="Cette action est irréversible. La suppression est refusée si ce lieu est référencé par un poste ou une idée RSE."
        confirmLabel="Supprimer"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => void handleConfirmDelete()}
      />
    </div>
  );
}
