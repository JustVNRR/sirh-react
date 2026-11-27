import { Download, Eye, PackageCheck, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useCompaniesQuery, useContractTypesQuery } from '@/features/organization';
import type { BlobDownloadResult } from '@/shared/api/httpClient';
import { ApiError } from '@/shared/api/types';
import { usePermission } from '@/shared/auth/AuthContext';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { formatFileSize, triggerBlobDownload } from '@/shared/lib/file';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  EmptyState,
  Input,
  PageHeader,
  PdfPreviewModal,
  Select,
  Spinner,
} from '@/shared/ui';
import { commonDocumentsApi } from '../api/commonDocumentsApi';
import { CommonDocumentFormDialog } from '../components/CommonDocumentFormDialog';
import { COMMON_DOCUMENT_CATEGORY_LABELS } from '../constants/commonDocumentTaxonomy';
import {
  useCommonDocumentsQuery,
  useDeleteCommonDocumentMutation,
} from '../hooks/useCommonDocumentsQueries';
import type { CommonDocumentDto } from '../types/internalLifeTypes';

export function WelcomeKitsPage() {
  const { can } = usePermission();
  const canWrite = can(PERMISSIONS.WELCOME_KITS_WRITE) || can(PERMISSIONS.COMMON_DOCS_WRITE);

  const [contractTypeId, setContractTypeId] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [search, setSearch] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CommonDocumentDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CommonDocumentDto | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [previewResult, setPreviewResult] = useState<BlobDownloadResult | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 300);
  const companiesQuery = useCompaniesQuery({ page: 1, pageSize: 100 });
  const contractTypesQuery = useContractTypesQuery({ page: 1, pageSize: 100 });
  const kitsQuery = useCommonDocumentsQuery({
    isWelcomeKit: true,
    contractTypeId: contractTypeId || undefined,
    companyId: companyId || undefined,
    archived: false,
    search: debouncedSearch || undefined,
    page: 1,
    pageSize: 50,
  });
  const deleteMutation = useDeleteCommonDocumentMutation();

  const contractTypeMap = new Map(
    (contractTypesQuery.data?.items ?? []).map((ct) => [ct.id, ct.label]),
  );

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

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    setActionError(null);
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success('Kit d’accueil supprimé.');
      setDeleteTarget(null);
    } catch (error) {
      setActionError(error instanceof ApiError ? error.detail : 'Impossible de supprimer ce kit.');
      setDeleteTarget(null);
    }
  };

  const items = kitsQuery.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kits d’accueil"
        description="Livrets d’intégration, mutuelle, prévoyance et guides pratiques filtrables par type de contrat."
        actions={
          canWrite && (
            <Button
              onClick={() => {
                setEditTarget(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Ajouter un kit d’accueil
            </Button>
          )
        }
      />

      <div className="grid gap-3 md:grid-cols-3">
        <Select
          aria-label="Filtrer par type de contrat"
          value={contractTypeId}
          onChange={(e) => setContractTypeId(e.target.value)}
        >
          <option value="">Tous les types de contrat</option>
          {(contractTypesQuery.data?.items ?? []).map((ct) => (
            <option key={ct.id} value={ct.id}>
              {ct.label} ({ct.code})
            </option>
          ))}
        </Select>

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

        <Input
          aria-label="Rechercher un kit d’accueil"
          placeholder="Rechercher un document du kit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {actionError && (
        <Alert variant="danger" title="Erreur">
          {actionError}
        </Alert>
      )}

      {kitsQuery.isLoading && <Spinner label="Chargement des kits d’accueil..." />}

      {kitsQuery.error && (
        <Alert variant="danger" title="Erreur">
          {kitsQuery.error instanceof ApiError
            ? kitsQuery.error.detail
            : 'Impossible de charger les kits d’accueil.'}
        </Alert>
      )}

      {!kitsQuery.isLoading && !kitsQuery.error && items.length === 0 && (
        <EmptyState
          icon={<PackageCheck className="h-6 w-6" aria-hidden="true" />}
          title="Aucun kit d’accueil disponible"
          description="Aucun document d’accueil actif ne correspond aux filtres choisis."
        />
      )}

      {items.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((kit) => (
            <Card key={kit.id} className="flex flex-col justify-between">
              <CardHeader className="space-y-2 pb-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="primary">{COMMON_DOCUMENT_CATEGORY_LABELS[kit.category]}</Badge>
                  <Badge variant={kit.contractTypeId ? 'info' : 'success'}>
                    {kit.contractTypeId
                      ? (contractTypeMap.get(kit.contractTypeId) ?? 'Contrat ciblé')
                      : 'Universel'}
                  </Badge>
                </div>
                <CardTitle className="text-base">{kit.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {kit.description && (
                  <p className="text-sm text-[var(--muted-foreground)]">{kit.description}</p>
                )}
                <p className="text-xs text-[var(--muted-foreground)]">
                  {kit.fileName} ({formatFileSize(kit.fileSizeBytes)})
                </p>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] pt-3">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleOpenFile(kit, false).catch(() => undefined);
                      }}
                    >
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      Aperçu
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Télécharger ${kit.title}`}
                      onClick={() => {
                        handleOpenFile(kit, true).catch(() => undefined);
                      }}
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  </div>

                  {canWrite && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Modifier ${kit.title}`}
                        onClick={() => {
                          setEditTarget(kit);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Supprimer ${kit.title}`}
                        onClick={() => setDeleteTarget(kit)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-[var(--danger)]" aria-hidden="true" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CommonDocumentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        document={editTarget}
        welcomeKitMode
        onRefreshRequested={() => {
          kitsQuery.refetch().catch(() => undefined);
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
        fileName={previewResult?.fileName ?? 'kit-accueil.pdf'}
        title={previewResult?.fileName ?? 'Aperçu du kit'}
      />
    </div>
  );
}
