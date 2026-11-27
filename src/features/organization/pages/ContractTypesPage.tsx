import type { ColumnDef } from '@tanstack/react-table';
import { Lock, Pencil, Plus, Trash2 } from 'lucide-react';
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  DataTable,
  Input,
  PageHeader,
  Select,
} from '@/shared/ui';
import { ContractTypeFormDialog } from '../components/ContractTypeFormDialog';
import {
  useContractTypesQuery,
  useDeleteContractTypeMutation,
  useDepartmentsQuery,
} from '../hooks/useOrganizationQueries';
import type { ContractTypeDto } from '../types/organizationTypes';

export function ContractTypesPage() {
  const { can } = usePermission();
  const canWrite = can(PERMISSIONS.CONTRACT_TYPES_WRITE);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'true' | 'false'>('all');
  const debouncedSearch = useDebounce(searchInput, 300);

  const contractTypesQuery = useContractTypesQuery({
    active: activeFilter === 'all' ? undefined : activeFilter === 'true',
    search: debouncedSearch || undefined,
    page,
    pageSize: 20,
  });
  const departmentsQuery = useDepartmentsQuery();
  const deleteMutation = useDeleteContractTypeMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ContractTypeDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ContractTypeDto | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success('Type de contrat supprimé.');
      setDeleteTarget(null);
    } catch (error) {
      setDeleteError(
        error instanceof ApiError ? error.detail : 'Impossible de supprimer ce type de contrat.',
      );
      setDeleteTarget(null);
    }
  };

  const columns: ColumnDef<ContractTypeDto, unknown>[] = [
    {
      accessorKey: 'code',
      header: 'Code',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold">{row.original.code}</span>
          {row.original.isSystem && (
            <Badge variant="info">
              <Lock className="mr-1 h-3 w-3" aria-hidden="true" />
              Système
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'label',
      header: 'Libellé',
    },
    {
      accessorKey: 'isActive',
      header: 'Statut',
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'success' : 'neutral'}>
          {row.original.isActive ? 'Actif' : 'Inactif'}
        </Badge>
      ),
    },
    ...(canWrite
      ? [
          {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }: { row: { original: ContractTypeDto } }) => (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedType(row.original);
                    setDialogOpen(true);
                  }}
                  aria-label={`Modifier ${row.original.code}`}
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={row.original.isSystem}
                  title={
                    row.original.isSystem
                      ? 'Les types de contrat système ne peuvent pas être supprimés.'
                      : undefined
                  }
                  onClick={() => {
                    setDeleteError(null);
                    setDeleteTarget(row.original);
                  }}
                  aria-label={`Supprimer ${row.original.code}`}
                >
                  <Trash2 className="h-4 w-4 text-[var(--danger)]" aria-hidden="true" />
                </Button>
              </div>
            ),
          } satisfies ColumnDef<ContractTypeDto, unknown>,
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Types de contrat & Référentiels"
        description="Gérez les types de contrat et consultez la nomenclature officielle des départements."
        actions={
          canWrite && (
            <Button
              onClick={() => {
                setSelectedType(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nouveau type
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
          aria-label="Rechercher un type de contrat"
          placeholder="Rechercher par code ou libellé..."
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
          <option value="all">Tous</option>
          <option value="true">Actifs</option>
          <option value="false">Inactifs</option>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={contractTypesQuery.data?.items ?? []}
        page={contractTypesQuery.data?.page ?? page}
        pageSize={contractTypesQuery.data?.pageSize ?? 20}
        totalCount={contractTypesQuery.data?.totalCount ?? 0}
        totalPages={contractTypesQuery.data?.totalPages ?? 1}
        onPageChange={setPage}
        isLoading={contractTypesQuery.isLoading}
        errorMessage={
          contractTypesQuery.error instanceof ApiError ? contractTypesQuery.error.detail : undefined
        }
        emptyTitle="Aucun type de contrat"
      />

      <Card>
        <CardHeader>
          <CardTitle>Départements métier (référentiel API)</CardTitle>
          <CardDescription>
            Codes et libellés officiels fournis par l&apos;API pour les fiches collaborateurs et
            postes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {departmentsQuery.data?.map((dept) => (
              <Badge key={dept.code} variant="neutral" className="gap-1.5 py-1">
                <span className="font-mono text-[11px] text-[var(--muted-foreground)]">
                  {dept.code}
                </span>
                <span>{dept.label}</span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <ContractTypeFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        contractType={selectedType}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title={`Supprimer ${deleteTarget?.code ?? ''} ?`}
        description="La suppression est bloquée si ce type de contrat est utilisé par des contrats ou kits d'accueil."
        confirmLabel="Supprimer"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => void handleConfirmDelete()}
      />
    </div>
  );
}
