import type { ColumnDef } from '@tanstack/react-table';
import { Archive, ArchiveRestore, Download, Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useCompaniesQuery } from '@/features/organization';
import type { BlobDownloadResult } from '@/shared/api/httpClient';
import { ApiError } from '@/shared/api/types';
import { usePermission } from '@/shared/auth/AuthContext';
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
  PageHeader,
  PdfPreviewModal,
  Select,
} from '@/shared/ui';
import { commonDocumentsApi } from '../api/commonDocumentsApi';
import { CommonDocumentFormDialog } from '../components/CommonDocumentFormDialog';
import {
  ALL_COMMON_DOCUMENT_CATEGORIES,
  COMMON_DOCUMENT_CATEGORY_LABELS,
  canWriteCommonDocumentCategory,
} from '../constants/commonDocumentTaxonomy';
import {
  useArchiveCommonDocumentMutation,
  useCommonDocumentsQuery,
  useDeleteCommonDocumentMutation,
} from '../hooks/useCommonDocumentsQueries';
import type { CommonDocumentCategory, CommonDocumentDto } from '../types/internalLifeTypes';

export function CommonDocumentsPage() {
  const { can } = usePermission();
  const canWriteAll = can(PERMISSIONS.COMMON_DOCS_WRITE);
  const canWriteCse = can(PERMISSIONS.COMMON_DOCS_WRITE_CSE);
  const canCreateAny = canWriteAll || canWriteCse;

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CommonDocumentCategory | ''>('');
  const [companyId, setCompanyId] = useState('');
  const [archivedFilter, setArchivedFilter] = useState<'false' | 'true' | 'all'>('false');
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CommonDocumentDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CommonDocumentDto | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [previewResult, setPreviewResult] = useState<BlobDownloadResult | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 300);
  const companiesQuery = useCompaniesQuery({ page: 1, pageSize: 100 });
  const archivedParam = archivedFilter === 'all' ? undefined : archivedFilter === 'true';

  const docsQuery = useCommonDocumentsQuery({
    search: debouncedSearch || undefined,
    category: category || undefined,
    companyId: companyId || undefined,
    archived: archivedParam,
    page,
    pageSize: 20,
  });
  const archiveMutation = useArchiveCommonDocumentMutation();
  const deleteMutation = useDeleteCommonDocumentMutation();

  const handleOpenFile = async (doc: CommonDocumentDto, download: boolean) => {
    setActionError(null);
    try {
      const res = await commonDocumentsApi.downloadFile(doc.id, download);
      if (download) {
        triggerBlobDownload(res.blob, res.fileName || doc.fileName);
      } else {
        setPreviewResult(res);
        setPreviewOpen(true);
      }
    } catch (error) {
      setActionError(error instanceof ApiError ? error.detail : 'Impossible d’ouvrir le fichier.');
    }
  };

  const handleToggleArchive = async (doc: CommonDocumentDto) => {
    setActionError(null);
    try {
      await archiveMutation.mutateAsync({
        id: doc.id,
        isArchived: !doc.isArchived,
        rowVersion: doc.rowVersion,
      });
      toast.success(doc.isArchived ? 'Document désarchivé.' : 'Document archivé.');
    } catch (error) {
      setActionError(
        error instanceof ApiError ? error.detail : 'Impossible de modifier l’archivage.',
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

  const columns: ColumnDef<CommonDocumentDto>[] = [
    {
      id: 'title',
      header: 'Document',
      cell: ({ row }) => {
        const doc = row.original;
        return (
          <div>
            <p className="font-medium text-[var(--foreground)]">{doc.title}</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              {doc.fileName} ({formatFileSize(doc.fileSizeBytes)})
            </p>
          </div>
        );
      },
    },
    {
      id: 'category',
      header: 'Catégorie',
      cell: ({ row }) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="neutral">{COMMON_DOCUMENT_CATEGORY_LABELS[row.original.category]}</Badge>
          {row.original.isArchived && <Badge variant="warning">Archivé</Badge>}
        </div>
      ),
    },
    {
      id: 'date',
      header: 'Date',
      cell: ({ row }) => formatDateFr(row.original.fileDate),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const doc = row.original;
        const canEditThis = canWriteCommonDocumentCategory(doc.category, {
          canWriteAll,
          canWriteCse,
          canWriteWelcomeKits: false,
        });
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Aperçu de ${doc.title}`}
              onClick={() => {
                handleOpenFile(doc, false).catch(() => undefined);
              }}
            >
              <Eye className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Télécharger ${doc.title}`}
              onClick={() => {
                handleOpenFile(doc, true).catch(() => undefined);
              }}
            >
              <Download className="h-4 w-4" aria-hidden="true" />
            </Button>
            {canEditThis && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Modifier ${doc.title}`}
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
                  aria-label={doc.isArchived ? `Désarchiver ${doc.title}` : `Archiver ${doc.title}`}
                  onClick={() => {
                    handleToggleArchive(doc).catch(() => undefined);
                  }}
                >
                  {doc.isArchived ? (
                    <ArchiveRestore className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Archive className="h-4 w-4" aria-hidden="true" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Supprimer ${doc.title}`}
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
        : 'Impossible de charger les documents communs.';
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents communs"
        description="Accords d’entreprise, conventions collectives, procès-verbaux CSE et publications internes."
        actions={
          canCreateAny && (
            <Button
              onClick={() => {
                setEditTarget(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Publier un document
            </Button>
          )
        }
      />

      <div className="grid gap-3 md:grid-cols-4">
        <Input
          aria-label="Rechercher un document commun"
          placeholder="Rechercher par titre ou description..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <Select
          aria-label="Filtrer par catégorie"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value as CommonDocumentCategory | '');
            setPage(1);
          }}
        >
          <option value="">Toutes les catégories</option>
          {ALL_COMMON_DOCUMENT_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {COMMON_DOCUMENT_CATEGORY_LABELS[cat]}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Filtrer par entreprise"
          value={companyId}
          onChange={(e) => {
            setCompanyId(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Toutes les entreprises</option>
          {(companiesQuery.data?.items ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Filtrer par archivage"
          value={archivedFilter}
          onChange={(e) => {
            setArchivedFilter(e.target.value as 'false' | 'true' | 'all');
            setPage(1);
          }}
        >
          <option value="false">Documents actifs</option>
          <option value="true">Documents archivés</option>
          <option value="all">Tous (actifs + archivés)</option>
        </Select>
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
        emptyTitle="Aucun document commun"
        emptyDescription="Aucun document publié ne correspond aux critères sélectionnés."
      />

      <CommonDocumentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        document={editTarget}
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
        title={`Supprimer ${deleteTarget?.title ?? ''} ?`}
        description="Le fichier associé sera définitivement supprimé."
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
