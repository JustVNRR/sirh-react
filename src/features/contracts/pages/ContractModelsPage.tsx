import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useContractTypesQuery } from '@/features/organization';
import { ApiError } from '@/shared/api/types';
import { usePermission } from '@/shared/auth/AuthContext';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { formatDateFr } from '@/shared/lib/format';
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
import {
  useContractModelsQuery,
  useDeleteContractModelMutation,
} from '../hooks/useContractModelsQueries';
import type { ContractModelDto } from '../types/contractTypes';

export function ContractModelsPage() {
  const { can } = usePermission();
  const canWrite = can(PERMISSIONS.CONTRACT_MODELS_WRITE);

  const [search, setSearch] = useState('');
  const [contractTypeId, setContractTypeId] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'true' | 'false'>('all');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<ContractModelDto | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const contractTypesQuery = useContractTypesQuery({ page: 1, pageSize: 100 });
  const activeParam = activeFilter === 'all' ? undefined : activeFilter === 'true';

  const modelsQuery = useContractModelsQuery({
    search: debouncedSearch || undefined,
    contractTypeId: contractTypeId || undefined,
    active: activeParam,
    page,
    pageSize: 20,
  });
  const deleteMutation = useDeleteContractModelMutation();

  const contractTypeMap = new Map(
    (contractTypesQuery.data?.items ?? []).map((ct) => [ct.id, ct.label]),
  );

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success('Modèle de contrat supprimé.');
      setDeleteTarget(null);
    } catch (error) {
      setDeleteError(
        error instanceof ApiError ? error.detail : 'Impossible de supprimer ce modèle.',
      );
      setDeleteTarget(null);
    }
  };

  const columns: ColumnDef<ContractModelDto>[] = [
    {
      id: 'title',
      header: 'Modèle',
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div>
            <Link
              to={`/contracts/models/${item.id}`}
              className="font-medium text-[var(--primary)] hover:underline"
            >
              {item.title}
            </Link>
            {item.description && (
              <p className="text-xs text-[var(--muted-foreground)]">{item.description}</p>
            )}
          </div>
        );
      },
    },
    {
      id: 'type',
      header: 'Type de contrat',
      cell: ({ row }) => {
        const id = row.original.contractTypeId;
        return id ? (contractTypeMap.get(id) ?? '—') : 'Générique';
      },
    },
    {
      id: 'vars',
      header: 'Variables perso.',
      cell: ({ row }) => String(row.original.customVariables.length),
    },
    {
      id: 'status',
      header: 'Statut',
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'success' : 'neutral'}>
          {row.original.isActive ? 'Actif' : 'Inactif'}
        </Badge>
      ),
    },
    {
      id: 'updated',
      header: 'Mis à jour',
      cell: ({ row }) => formatDateFr(row.original.updatedAtUtc),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild>
              <Link
                to={`/contracts/models/${item.id}`}
                aria-label={`Ouvrir le studio pour ${item.title}`}
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            {canWrite && (
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Supprimer le modèle ${item.title}`}
                onClick={() => {
                  setDeleteError(null);
                  setDeleteTarget(item);
                }}
              >
                <Trash2 className="h-4 w-4 text-[var(--danger)]" aria-hidden="true" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const models = modelsQuery.data?.items ?? [];
  const totalCount = modelsQuery.data?.totalCount ?? 0;
  const totalPages = modelsQuery.data?.totalPages ?? 1;
  let errorMessage: string | undefined;
  if (modelsQuery.error) {
    errorMessage =
      modelsQuery.error instanceof ApiError
        ? modelsQuery.error.detail
        : 'Impossible de charger les modèles de contrat.';
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Modèles de contrat"
        description="Studio Markdown/Scriban avec variables métier et prévisualisation QuestPDF."
        actions={
          canWrite && (
            <Button asChild>
              <Link to="/contracts/models/new">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Nouveau modèle
              </Link>
            </Button>
          )
        }
      />

      <div className="grid gap-3 md:grid-cols-3">
        <Input
          aria-label="Rechercher un modèle"
          placeholder="Rechercher par titre ou description..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <Select
          aria-label="Filtrer par type de contrat"
          value={contractTypeId}
          onChange={(e) => {
            setContractTypeId(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Tous les types de contrat</option>
          {(contractTypesQuery.data?.items ?? []).map((ct) => (
            <option key={ct.id} value={ct.id}>
              {ct.label}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Filtrer par statut"
          value={activeFilter}
          onChange={(e) => {
            setActiveFilter(e.target.value as 'all' | 'true' | 'false');
            setPage(1);
          }}
        >
          <option value="all">Tous les statuts</option>
          <option value="true">Actifs uniquement</option>
          <option value="false">Inactifs uniquement</option>
        </Select>
      </div>

      {deleteError && (
        <Alert variant="danger" title="Suppression impossible">
          {deleteError}
        </Alert>
      )}

      <DataTable
        columns={columns}
        data={models}
        page={page}
        pageSize={20}
        totalCount={totalCount}
        totalPages={totalPages}
        onPageChange={setPage}
        isLoading={modelsQuery.isLoading}
        errorMessage={errorMessage}
        emptyTitle="Aucun modèle de contrat"
        emptyDescription="Créez un modèle Scriban pour générer des contrats PDF."
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title={`Supprimer ${deleteTarget?.title ?? ''} ?`}
        description="Cette action est irréversible. Les contrats déjà générés restent conservés."
        confirmLabel="Supprimer"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => void handleConfirmDelete()}
      />
    </div>
  );
}
