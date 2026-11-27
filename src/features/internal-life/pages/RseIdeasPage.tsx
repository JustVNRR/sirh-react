import { CheckSquare, Download, Eye, Lightbulb, MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useLocationsQuery } from '@/features/organization';
import type { BlobDownloadResult } from '@/shared/api/httpClient';
import { ApiError } from '@/shared/api/types';
import { useAuth, usePermission } from '@/shared/auth/AuthContext';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { triggerBlobDownload } from '@/shared/lib/file';
import { formatDateTimeFr } from '@/shared/lib/format';
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
  PdfPreviewModal,
  Select,
  Spinner,
} from '@/shared/ui';
import { rseIdeasApi } from '../api/cseRseApi';
import { RseIdeaFormDialog } from '../components/RseIdeaFormDialog';
import { TreatRseIdeaDialog } from '../components/TreatRseIdeaDialog';
import { useDeleteRseIdeaMutation, useRseIdeasQuery } from '../hooks/useCseRseQueries';
import { RSE_STATUS_BADGE, RSE_STATUS_LABELS, RSE_STATUS_VALUES } from '../schemas/cseRseSchemas';
import type { RseIdeaDto, RseIdeaStatus } from '../types/cseRseTypes';

function RseIdeaCard({
  idea,
  locationName,
  canEditAuthor,
  canTreat,
  onPreviewAttachment,
  onDownloadAttachment,
  onEdit,
  onDelete,
  onTreat,
}: {
  idea: RseIdeaDto;
  locationName?: string;
  canEditAuthor: boolean;
  canTreat: boolean;
  onPreviewAttachment: (idea: RseIdeaDto) => void;
  onDownloadAttachment: (idea: RseIdeaDto) => void;
  onEdit: (idea: RseIdeaDto) => void;
  onDelete: (idea: RseIdeaDto) => void;
  onTreat: (idea: RseIdeaDto) => void;
}) {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={RSE_STATUS_BADGE[idea.status]}>
                {RSE_STATUS_LABELS[idea.status]}
              </Badge>
              {locationName && (
                <Badge variant="neutral" className="gap-1">
                  <MapPin className="h-3 w-3" aria-hidden="true" />
                  {locationName}
                </Badge>
              )}
              <span className="text-xs text-[var(--muted-foreground)]">
                {formatDateTimeFr(idea.createdAtUtc)}
              </span>
            </div>
            <h3 className="text-base font-semibold text-[var(--foreground)]">{idea.title}</h3>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {canTreat && (
              <Button variant="outline" size="sm" onClick={() => onTreat(idea)}>
                <CheckSquare className="h-3.5 w-3.5" aria-hidden="true" />
                Traiter
              </Button>
            )}
            {canEditAuthor && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Modifier l’idée ${idea.title}`}
                  onClick={() => onEdit(idea)}
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Supprimer l’idée ${idea.title}`}
                  onClick={() => onDelete(idea)}
                >
                  <Trash2 className="h-4 w-4 text-[var(--danger)]" aria-hidden="true" />
                </Button>
              </>
            )}
          </div>
        </div>

        <p className="whitespace-pre-line text-sm text-[var(--foreground)]">{idea.ideaContent}</p>

        {idea.rhComment && (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
              Retour RH
            </p>
            <p className="mt-1 text-[var(--foreground)]">{idea.rhComment}</p>
          </div>
        )}

        {idea.hasAttachment && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => onPreviewAttachment(idea)}>
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              {idea.attachmentFileName ?? 'Pièce jointe'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Télécharger ${idea.attachmentFileName ?? 'la pièce jointe'}`}
              onClick={() => onDownloadAttachment(idea)}
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function RseIdeasPage() {
  const { user } = useAuth();
  const { can } = usePermission();
  const canReadAll = can(PERMISSIONS.RSE_READ_ALL);
  const canWrite = can(PERMISSIONS.RSE_WRITE);
  const canTreat = can(PERMISSIONS.RSE_TREAT);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<RseIdeaStatus | ''>('');
  const [locationId, setLocationId] = useState('');
  const [mineOnly, setMineOnly] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<RseIdeaDto | null>(null);
  const [treatTarget, setTreatTarget] = useState<RseIdeaDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RseIdeaDto | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [previewResult, setPreviewResult] = useState<BlobDownloadResult | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 300);
  const locationsQuery = useLocationsQuery({ page: 1, pageSize: 100 });
  const ideasQuery = useRseIdeasQuery({
    search: debouncedSearch || undefined,
    status: status || undefined,
    locationId: locationId || undefined,
    mineOnly: canReadAll && mineOnly ? true : undefined,
    page: 1,
    pageSize: 50,
  });
  const deleteMutation = useDeleteRseIdeaMutation();

  const locationMap = new Map(
    (locationsQuery.data?.items ?? []).map((loc) => [loc.id, `${loc.name} (${loc.city})`]),
  );

  const handleOpenAttachment = async (idea: RseIdeaDto, download: boolean) => {
    setActionError(null);
    try {
      const res = await rseIdeasApi.downloadAttachment(idea.id, download);
      if (download) {
        triggerBlobDownload(res.blob, res.fileName || idea.attachmentFileName || 'piece-jointe');
      } else {
        setPreviewResult(res);
        setPreviewOpen(true);
      }
    } catch (error) {
      setActionError(
        error instanceof ApiError ? error.detail : 'Impossible d’ouvrir la pièce jointe.',
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
      toast.success('Idée RSE supprimée.');
      setDeleteTarget(null);
    } catch (error) {
      setActionError(error instanceof ApiError ? error.detail : 'Impossible de supprimer l’idée.');
      setDeleteTarget(null);
    }
  };

  const items = ideasQuery.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Boîte à idées RSE"
        description="Proposez des actions responsables et suivez le traitement par les Ressources Humaines."
        actions={
          canWrite && (
            <Button
              onClick={() => {
                setEditTarget(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Soumettre une idée RSE
            </Button>
          )
        }
      />

      <div className="grid gap-3 md:grid-cols-4">
        <Input
          aria-label="Rechercher une idée RSE"
          placeholder="Rechercher par titre ou contenu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Select
          aria-label="Filtrer par statut"
          value={status}
          onChange={(e) => setStatus(e.target.value as RseIdeaStatus | '')}
        >
          <option value="">Tous les statuts</option>
          {RSE_STATUS_VALUES.map((st) => (
            <option key={st} value={st}>
              {RSE_STATUS_LABELS[st]}
            </option>
          ))}
        </Select>

        <Select
          aria-label="Filtrer par lieu"
          value={locationId}
          onChange={(e) => setLocationId(e.target.value)}
        >
          <option value="">Tous les établissements</option>
          {(locationsQuery.data?.items ?? []).map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name} ({loc.city})
            </option>
          ))}
        </Select>

        {canReadAll && (
          <div className="flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
            <Checkbox
              id="rse-mine-only"
              label="Mes idées uniquement"
              checked={mineOnly}
              onChange={(e) => setMineOnly(e.target.checked)}
            />
          </div>
        )}
      </div>

      {actionError && (
        <Alert variant="danger" title="Erreur">
          {actionError}
        </Alert>
      )}

      {ideasQuery.isLoading && <Spinner label="Chargement des idées RSE..." />}

      {ideasQuery.error && (
        <Alert variant="danger" title="Erreur">
          {ideasQuery.error instanceof ApiError
            ? ideasQuery.error.detail
            : 'Impossible de charger les idées RSE.'}
        </Alert>
      )}

      {!ideasQuery.isLoading && !ideasQuery.error && items.length === 0 && (
        <EmptyState
          icon={<Lightbulb className="h-6 w-6" aria-hidden="true" />}
          title="Aucune idée RSE"
          description="Soyez le premier à proposer une initiative !"
        />
      )}

      {items.length > 0 && (
        <div className="space-y-4">
          {items.map((idea) => {
            const isEditableAuthor =
              canWrite && idea.authorEmployeeId === user?.employeeId && idea.status === 'submitted';

            return (
              <RseIdeaCard
                key={idea.id}
                idea={idea}
                locationName={idea.locationId ? locationMap.get(idea.locationId) : undefined}
                canEditAuthor={isEditableAuthor}
                canTreat={canTreat}
                onPreviewAttachment={(target) => {
                  handleOpenAttachment(target, false).catch(() => undefined);
                }}
                onDownloadAttachment={(target) => {
                  handleOpenAttachment(target, true).catch(() => undefined);
                }}
                onEdit={(target) => {
                  setEditTarget(target);
                  setFormOpen(true);
                }}
                onDelete={setDeleteTarget}
                onTreat={setTreatTarget}
              />
            );
          })}
        </div>
      )}

      <RseIdeaFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        idea={editTarget}
        onRefreshRequested={() => {
          ideasQuery.refetch().catch(() => undefined);
        }}
      />

      <TreatRseIdeaDialog
        idea={treatTarget}
        onOpenChange={(open) => {
          if (!open) {
            setTreatTarget(null);
          }
        }}
        onRefreshRequested={() => {
          ideasQuery.refetch().catch(() => undefined);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title={`Supprimer l’idée « ${deleteTarget?.title ?? ''} » ?`}
        description="Cette proposition sera définitivement supprimée."
        confirmLabel="Supprimer"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => void handleConfirmDelete()}
      />

      <PdfPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        blob={previewResult?.blob ?? null}
        fileName={previewResult?.fileName ?? 'piece-jointe.pdf'}
        title={previewResult?.fileName ?? 'Aperçu de la pièce jointe'}
      />
    </div>
  );
}
