import type { ColumnDef } from '@tanstack/react-table';
import { Download, Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useEmployeesQuery } from '@/features/employees';
import type { BlobDownloadResult } from '@/shared/api/httpClient';
import { ApiError } from '@/shared/api/types';
import { useAuth, usePermission } from '@/shared/auth/AuthContext';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { formatFileSize, triggerBlobDownload } from '@/shared/lib/file';
import { formatDateFr } from '@/shared/lib/format';
import {
  Alert,
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  Input,
  PdfPreviewModal,
  Select,
} from '@/shared/ui';
import { employeeDocumentsApi } from '../api/employeeDocumentsApi';
import {
  CATEGORY_LABELS,
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_TYPES_BY_CATEGORY,
  getExpiryAlertStatus,
  getVisibleCategories,
  isSelfServiceWritableCategory,
} from '../constants/taxonomy';
import {
  useDeleteEmployeeDocumentMutation,
  useEmployeeDocumentsQuery,
} from '../hooks/useEmployeeDocumentsQueries';
import type {
  EmployeeDocumentCategory,
  EmployeeDocumentDto,
  EmployeeDocumentType,
} from '../types/employeeDocumentTypes';
import { EmployeeDocumentFormDialog } from './EmployeeDocumentFormDialog';

function DocumentMetadataCell({ doc }: { doc: EmployeeDocumentDto }) {
  if (doc.rqthDetails) {
    const alert = getExpiryAlertStatus(doc.rqthDetails.expiryDate);
    return (
      <div className="space-y-1">
        <Badge variant={alert.variant}>{alert.label}</Badge>
        {doc.rqthDetails.workplaceAccommodation && (
          <p className="text-xs text-[var(--muted-foreground)]">
            Aménagement : {doc.rqthDetails.workplaceAccommodation}
          </p>
        )}
      </div>
    );
  }

  if (doc.residentPermitDetails) {
    const alert = getExpiryAlertStatus(doc.residentPermitDetails.expiryDate);
    return (
      <div className="space-y-1">
        <Badge variant={alert.variant}>{alert.label}</Badge>
        <p className="text-xs text-[var(--muted-foreground)]">
          N° {doc.residentPermitDetails.permitNumber}
        </p>
      </div>
    );
  }

  return <span className="text-xs text-[var(--muted-foreground)]">—</span>;
}

export interface EmployeeDocumentsPanelProps {
  fixedEmployeeId?: string;
}

export function EmployeeDocumentsPanel({ fixedEmployeeId }: EmployeeDocumentsPanelProps) {
  const { user } = useAuth();
  const { can } = usePermission();

  const canReadSensitive = can(PERMISSIONS.EMPLOYEE_DOCS_READ_SENSITIVE);
  const canReadTeamOrAll =
    can(PERMISSIONS.EMPLOYEE_DOCS_READ_TEAM) || can(PERMISSIONS.EMPLOYEE_DOCS_READ_ALL);
  const canWriteAll = can(PERMISSIONS.EMPLOYEE_DOCS_WRITE_ALL);
  const canWriteSelf = can(PERMISSIONS.EMPLOYEE_DOCS_WRITE_SELF);
  const canAdd = canWriteAll || canWriteSelf;

  const visibleCategories = getVisibleCategories(canReadSensitive);

  const [selectedCategory, setSelectedCategory] = useState<EmployeeDocumentCategory | 'all'>('all');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(fixedEmployeeId ?? '');
  const [selectedDocType, setSelectedDocType] = useState<EmployeeDocumentType | ''>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EmployeeDocumentDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EmployeeDocumentDto | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [previewResult, setPreviewResult] = useState<BlobDownloadResult | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const employeesQuery = useEmployeesQuery(
    { page: 1, pageSize: 100 },
    !fixedEmployeeId && canReadTeamOrAll,
  );
  const docsQuery = useEmployeeDocumentsQuery({
    employeeId: fixedEmployeeId ?? (selectedEmployeeId || undefined),
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    documentTypes: selectedDocType ? [selectedDocType] : undefined,
    search: debouncedSearch || undefined,
    page,
    pageSize: 20,
  });
  const deleteMutation = useDeleteEmployeeDocumentMutation();

  const employeeMap = new Map(
    (employeesQuery.data?.items ?? []).map((e) => [e.id, `${e.firstName} ${e.lastName}`]),
  );

  const availableTypeOptions: EmployeeDocumentType[] =
    selectedCategory === 'all'
      ? visibleCategories.flatMap((cat) => DOCUMENT_TYPES_BY_CATEGORY[cat])
      : [...DOCUMENT_TYPES_BY_CATEGORY[selectedCategory]];

  const canModifyDocument = (doc: EmployeeDocumentDto): boolean => {
    if (canWriteAll) {
      return true;
    }
    return (
      canWriteSelf &&
      doc.employeeId === user?.employeeId &&
      isSelfServiceWritableCategory(doc.category)
    );
  };

  const handleOpenPreview = async (doc: EmployeeDocumentDto) => {
    setActionError(null);
    try {
      const res = await employeeDocumentsApi.downloadFile(doc.id, false);
      setPreviewResult(res);
      setPreviewOpen(true);
    } catch (error) {
      setActionError(error instanceof ApiError ? error.detail : 'Impossible d’ouvrir le fichier.');
    }
  };

  const handleDownload = async (doc: EmployeeDocumentDto) => {
    setActionError(null);
    try {
      const res = await employeeDocumentsApi.downloadFile(doc.id, true);
      triggerBlobDownload(res.blob, res.fileName || doc.fileName);
    } catch (error) {
      setActionError(
        error instanceof ApiError ? error.detail : 'Impossible de télécharger le fichier.',
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
      toast.success('Document supprimé.');
      setDeleteTarget(null);
    } catch (error) {
      setActionError(
        error instanceof ApiError ? error.detail : 'Impossible de supprimer ce document.',
      );
      setDeleteTarget(null);
    }
  };

  const columns: ColumnDef<EmployeeDocumentDto>[] = [
    {
      id: 'type',
      header: 'Document',
      cell: ({ row }) => {
        const doc = row.original;
        return (
          <div>
            <p className="font-medium text-[var(--foreground)]">
              {DOCUMENT_TYPE_LABELS[doc.documentType]}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">
              {doc.fileName} ({formatFileSize(doc.fileSizeBytes)})
            </p>
          </div>
        );
      },
    },
    ...(!fixedEmployeeId && canReadTeamOrAll
      ? [
          {
            id: 'employee',
            header: 'Collaborateur',
            cell: ({ row }: { row: { original: EmployeeDocumentDto } }) =>
              employeeMap.get(row.original.employeeId) ?? row.original.employeeId,
          },
        ]
      : []),
    {
      id: 'category',
      header: 'Catégorie',
      cell: ({ row }) => <Badge variant="neutral">{CATEGORY_LABELS[row.original.category]}</Badge>,
    },
    {
      id: 'date',
      header: 'Date',
      cell: ({ row }) => formatDateFr(row.original.fileDate),
    },
    {
      id: 'metadata',
      header: 'Échéance / Détails',
      cell: ({ row }) => <DocumentMetadataCell doc={row.original} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const doc = row.original;
        const canEditThis = canModifyDocument(doc);
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Aperçu de ${doc.fileName}`}
              onClick={() => {
                handleOpenPreview(doc).catch(() => undefined);
              }}
            >
              <Eye className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Télécharger ${doc.fileName}`}
              onClick={() => {
                handleDownload(doc).catch(() => undefined);
              }}
            >
              <Download className="h-4 w-4" aria-hidden="true" />
            </Button>
            {canEditThis && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Modifier ${doc.fileName}`}
                  onClick={() => {
                    setEditTarget(doc);
                    setFormOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Supprimer ${doc.fileName}`}
                  onClick={() => setDeleteTarget(doc)}
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

  const items = docsQuery.data?.items ?? [];
  const totalCount = docsQuery.data?.totalCount ?? 0;
  const totalPages = docsQuery.data?.totalPages ?? 1;
  let errorMessage: string | undefined;
  if (docsQuery.error) {
    errorMessage =
      docsQuery.error instanceof ApiError
        ? docsQuery.error.detail
        : 'Impossible de charger les documents.';
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Catégories de documents">
          <Button
            type="button"
            size="sm"
            variant={selectedCategory === 'all' ? 'primary' : 'outline'}
            onClick={() => {
              setSelectedCategory('all');
              setSelectedDocType('');
              setPage(1);
            }}
          >
            Toutes
          </Button>
          {visibleCategories.map((cat) => (
            <Button
              key={cat}
              type="button"
              size="sm"
              variant={selectedCategory === cat ? 'primary' : 'outline'}
              onClick={() => {
                setSelectedCategory(cat);
                setSelectedDocType('');
                setPage(1);
              }}
            >
              {CATEGORY_LABELS[cat]}
            </Button>
          ))}
        </div>

        {canAdd && (
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setEditTarget(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Déposer un document
          </Button>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Input
          aria-label="Rechercher un document"
          placeholder="Rechercher par nom de fichier ou commentaire..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />

        <Select
          aria-label="Filtrer par type de document"
          value={selectedDocType}
          onChange={(e) => {
            setSelectedDocType(e.target.value as EmployeeDocumentType | '');
            setPage(1);
          }}
        >
          <option value="">Tous les types de pièces</option>
          {availableTypeOptions.map((type) => (
            <option key={type} value={type}>
              {DOCUMENT_TYPE_LABELS[type]}
            </option>
          ))}
        </Select>

        {!fixedEmployeeId && canReadTeamOrAll && (
          <Select
            aria-label="Filtrer par collaborateur"
            value={selectedEmployeeId}
            onChange={(e) => {
              setSelectedEmployeeId(e.target.value);
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
      </div>

      {actionError && (
        <Alert variant="danger" title="Erreur">
          {actionError}
        </Alert>
      )}

      <DataTable
        columns={columns}
        data={items}
        page={page}
        pageSize={20}
        totalCount={totalCount}
        totalPages={totalPages}
        onPageChange={setPage}
        isLoading={docsQuery.isLoading}
        errorMessage={errorMessage}
        emptyTitle="Aucun document dans cette catégorie"
        emptyDescription="Déposez une pièce justificative ou modifiez vos filtres."
      />

      <EmployeeDocumentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        document={editTarget}
        fixedEmployeeId={fixedEmployeeId}
        onRefreshRequested={() => {
          docsQuery.refetch().catch(() => undefined);
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
        description="Le fichier chiffré associé sera définitivement supprimé."
        confirmLabel="Supprimer"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => void handleConfirmDelete()}
      />

      <PdfPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        blob={previewResult?.blob ?? null}
        fileName={previewResult?.fileName ?? 'document.pdf'}
        title={previewResult?.fileName ?? 'Aperçu du document'}
      />
    </div>
  );
}
