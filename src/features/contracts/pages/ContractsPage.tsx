import type { ColumnDef } from '@tanstack/react-table';
import { Download, Eye, FilePlus2, FileUp, Pencil, Sparkles, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useEmployeesQuery } from '@/features/employees';
import { useContractTypesQuery } from '@/features/organization';
import type { BlobDownloadResult } from '@/shared/api/httpClient';
import { ApiError } from '@/shared/api/types';
import { usePermission } from '@/shared/auth/AuthContext';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { formatFileSize, triggerBlobDownload } from '@/shared/lib/file';
import { formatDateFr } from '@/shared/lib/format';
import {
  Alert,
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  PageHeader,
  PdfPreviewModal,
  Select,
} from '@/shared/ui';
import { contractsApi } from '../api/contractsApi';
import { EditContractDialog } from '../components/EditContractDialog';
import { GenerateContractDialog } from '../components/GenerateContractDialog';
import { ImportContractDialog } from '../components/ImportContractDialog';
import { useContractsQuery, useDeleteContractMutation } from '../hooks/useContractsQueries';
import {
  CONTRACT_STATUS_BADGE_VARIANT,
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_VALUES,
} from '../schemas/contractSchemas';
import type { ContractDto, ContractStatus } from '../types/contractTypes';

export function ContractsPage() {
  const { can } = usePermission();
  const canReadAll = can(PERMISSIONS.CONTRACTS_READ_ALL);
  const canWrite = can(PERMISSIONS.CONTRACTS_WRITE);
  const canReadModels = can(PERMISSIONS.CONTRACT_MODELS_READ);

  const [employeeId, setEmployeeId] = useState('');
  const [status, setStatus] = useState<ContractStatus | ''>('');
  const [contractTypeId, setContractTypeId] = useState('');
  const [page, setPage] = useState(1);

  const [generateOpen, setGenerateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ContractDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ContractDto | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [previewResult, setPreviewResult] = useState<BlobDownloadResult | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const employeesQuery = useEmployeesQuery({ page: 1, pageSize: 100 }, canReadAll);
  const contractTypesQuery = useContractTypesQuery({ page: 1, pageSize: 100 });
  const contractsQuery = useContractsQuery({
    employeeId: employeeId || undefined,
    status: status || undefined,
    contractTypeId: contractTypeId || undefined,
    page,
    pageSize: 20,
  });
  const deleteMutation = useDeleteContractMutation();

  const employeeMap = new Map(
    (employeesQuery.data?.items ?? []).map((e) => [e.id, `${e.firstName} ${e.lastName}`]),
  );
  const contractTypeMap = new Map(
    (contractTypesQuery.data?.items ?? []).map((ct) => [ct.id, ct.label]),
  );

  const handleOpenPreview = async (contract: ContractDto) => {
    setActionError(null);
    try {
      const result = await contractsApi.downloadFile(contract.id, false);
      setPreviewResult(result);
      setPreviewOpen(true);
    } catch (error) {
      setActionError(error instanceof ApiError ? error.detail : 'Impossible d’ouvrir le PDF.');
    }
  };

  const handleDownload = async (contract: ContractDto) => {
    setActionError(null);
    try {
      const result = await contractsApi.downloadFile(contract.id, true);
      triggerBlobDownload(result.blob, result.fileName || contract.fileName);
    } catch (error) {
      setActionError(
        error instanceof ApiError ? error.detail : 'Impossible de télécharger le PDF.',
      );
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    setActionError(null);
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success('Contrat supprimé.');
      setDeleteTarget(null);
    } catch (error) {
      setActionError(
        error instanceof ApiError ? error.detail : 'Impossible de supprimer ce contrat.',
      );
      setDeleteTarget(null);
    }
  };

  const columns: ColumnDef<ContractDto>[] = [
    {
      id: 'employee',
      header: 'Collaborateur',
      cell: ({ row }) => employeeMap.get(row.original.employeeId) ?? row.original.employeeId,
    },
    {
      id: 'type',
      header: 'Type',
      cell: ({ row }) => contractTypeMap.get(row.original.contractTypeId) ?? '—',
    },
    {
      id: 'file',
      header: 'Document',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-[var(--foreground)]">{row.original.fileName}</p>
          <p className="text-xs text-[var(--muted-foreground)]">
            {formatFileSize(row.original.fileSizeBytes)} · {formatDateFr(row.original.fileDate)}
          </p>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Statut',
      cell: ({ row }) => (
        <Badge variant={CONTRACT_STATUS_BADGE_VARIANT[row.original.status]}>
          {CONTRACT_STATUS_LABELS[row.original.status]}
        </Badge>
      ),
    },
    {
      id: 'signedAt',
      header: 'Date signature',
      cell: ({ row }) => formatDateFr(row.original.signedAt),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Prévisualiser ${item.fileName}`}
              onClick={() => {
                handleOpenPreview(item).catch(() => undefined);
              }}
            >
              <Eye className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Télécharger ${item.fileName}`}
              onClick={() => {
                handleDownload(item).catch(() => undefined);
              }}
            >
              <Download className="h-4 w-4" aria-hidden="true" />
            </Button>
            {canWrite && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Modifier ${item.fileName}`}
                  onClick={() => setEditTarget(item)}
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Supprimer ${item.fileName}`}
                  onClick={() => setDeleteTarget(item)}
                >
                  <Trash2 className="h-4 w-4 text-[var(--danger)]" aria-hidden="true" />
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  const contracts = contractsQuery.data?.items ?? [];
  const totalCount = contractsQuery.data?.totalCount ?? 0;
  const totalPages = contractsQuery.data?.totalPages ?? 1;
  let errorMessage: string | undefined;
  if (contractsQuery.error) {
    errorMessage =
      contractsQuery.error instanceof ApiError
        ? contractsQuery.error.detail
        : 'Impossible de charger les contrats.';
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contrats"
        description="Générez des contrats PDF depuis un modèle, importez des PDF signés et suivez leur signature."
        actions={
          <div className="flex flex-wrap gap-2">
            {canReadModels && (
              <Button variant="outline" asChild>
                <Link to="/contracts/models">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  Modèles Scriban
                </Link>
              </Button>
            )}
            {canWrite && (
              <>
                <Button variant="outline" onClick={() => setImportOpen(true)}>
                  <FileUp className="h-4 w-4" aria-hidden="true" />
                  Importer un PDF
                </Button>
                <Button onClick={() => setGenerateOpen(true)}>
                  <FilePlus2 className="h-4 w-4" aria-hidden="true" />
                  Générer depuis un modèle
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="grid gap-3 md:grid-cols-3">
        {canReadAll && (
          <Select
            aria-label="Filtrer par collaborateur"
            value={employeeId}
            onChange={(e) => {
              setEmployeeId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tous les collaborateurs</option>
            {(employeesQuery.data?.items ?? []).map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName}
              </option>
            ))}
          </Select>
        )}

        <Select
          aria-label="Filtrer par type de contrat"
          value={contractTypeId}
          onChange={(e) => {
            setContractTypeId(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Tous les types</option>
          {(contractTypesQuery.data?.items ?? []).map((ct) => (
            <option key={ct.id} value={ct.id}>
              {ct.label}
            </option>
          ))}
        </Select>

        <Select
          aria-label="Filtrer par statut"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as ContractStatus | '');
            setPage(1);
          }}
        >
          <option value="">Tous les statuts</option>
          {CONTRACT_STATUS_VALUES.map((st) => (
            <option key={st} value={st}>
              {CONTRACT_STATUS_LABELS[st]}
            </option>
          ))}
        </Select>
      </div>

      {actionError && (
        <Alert variant="danger" title="Erreur">
          {actionError}
        </Alert>
      )}

      <DataTable
        columns={columns}
        data={contracts}
        page={page}
        pageSize={20}
        totalCount={totalCount}
        totalPages={totalPages}
        onPageChange={setPage}
        isLoading={contractsQuery.isLoading}
        errorMessage={errorMessage}
        emptyTitle="Aucun contrat enregistré"
        emptyDescription="Générez ou importez un contrat pour un poste."
      />

      <GenerateContractDialog open={generateOpen} onOpenChange={setGenerateOpen} />
      <ImportContractDialog open={importOpen} onOpenChange={setImportOpen} />
      <EditContractDialog
        contract={editTarget}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
          }
        }}
        onRefreshRequested={() => {
          contractsQuery.refetch().catch(() => undefined);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title={`Supprimer ${deleteTarget?.fileName ?? ''} ?`}
        description="Le fichier PDF chiffré associé sera définitivement supprimé."
        confirmLabel="Supprimer"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => void handleConfirmDelete()}
      />

      <PdfPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        blob={previewResult?.blob ?? null}
        fileName={previewResult?.fileName ?? 'contrat.pdf'}
        title={previewResult?.fileName ?? 'Aperçu du contrat'}
      />
    </div>
  );
}
