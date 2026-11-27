import { Download, Eye, FileText, FileUp, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { BlobDownloadResult } from '@/shared/api/httpClient';
import { ApiError } from '@/shared/api/types';
import { triggerBlobDownload } from '@/shared/lib/file';
import { formatDateFr } from '@/shared/lib/format';
import { Button, ConfirmDialog, PdfPreviewModal } from '@/shared/ui';
import { jobSheetsApi } from '../api/contractsApi';
import {
  useDeleteJobSheetMutation,
  useJobSheetByPositionQuery,
} from '../hooks/useJobSheetsQueries';
import { JobSheetFormDialog } from './JobSheetFormDialog';

export interface PositionJobSheetBarProps {
  positionId: string;
  positionTitle: string;
  canRead: boolean;
  canWrite: boolean;
}

export function PositionJobSheetBar({
  positionId,
  positionTitle,
  canRead,
  canWrite,
}: PositionJobSheetBarProps) {
  const query = useJobSheetByPositionQuery(positionId, canRead || canWrite);
  const deleteMutation = useDeleteJobSheetMutation();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [previewResult, setPreviewResult] = useState<BlobDownloadResult | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  if (!canRead && !canWrite) {
    return null;
  }

  const jobSheet = query.data ?? null;

  const handlePreview = async () => {
    if (!jobSheet) {
      return;
    }
    try {
      const res = await jobSheetsApi.downloadFile(jobSheet.id, false);
      setPreviewResult(res);
      setPreviewOpen(true);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : 'Impossible d’ouvrir la fiche.');
    }
  };

  const handleDownload = async () => {
    if (!jobSheet) {
      return;
    }
    try {
      const res = await jobSheetsApi.downloadFile(jobSheet.id, true);
      triggerBlobDownload(res.blob, res.fileName || jobSheet.fileName);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : 'Impossible de télécharger la fiche.');
    }
  };

  const handleDelete = async () => {
    if (!jobSheet) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(jobSheet.id);
      toast.success('Fiche de poste supprimée.');
      setDeleteOpen(false);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.detail : 'Impossible de supprimer la fiche de poste.',
      );
    }
  };

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] pt-3 text-xs">
      <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
        <FileText className="h-3.5 w-3.5" aria-hidden="true" />
        {jobSheet ? (
          <span>
            Fiche de poste :{' '}
            <strong className="font-medium text-[var(--foreground)]">{jobSheet.fileName}</strong> (
            {formatDateFr(jobSheet.fileDate)})
          </span>
        ) : (
          <span>Aucune fiche de poste associée</span>
        )}
      </div>

      <div className="flex items-center gap-1">
        {jobSheet ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                handlePreview().catch(() => undefined);
              }}
            >
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              Voir fiche de poste
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={`Télécharger la fiche de poste ${jobSheet.fileName}`}
              onClick={() => {
                handleDownload().catch(() => undefined);
              }}
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
            {canWrite && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label="Remplacer la fiche de poste"
                  onClick={() => setFormOpen(true)}
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label="Supprimer la fiche de poste"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-[var(--danger)]" aria-hidden="true" />
                </Button>
              </>
            )}
          </>
        ) : (
          canWrite && (
            <Button type="button" variant="outline" size="sm" onClick={() => setFormOpen(true)}>
              <FileUp className="h-3.5 w-3.5" aria-hidden="true" />
              Ajouter une fiche de poste
            </Button>
          )
        )}
      </div>

      <JobSheetFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        positionId={positionId}
        positionTitle={positionTitle}
        jobSheet={jobSheet}
        onRefreshRequested={() => {
          query.refetch().catch(() => undefined);
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Supprimer la fiche de poste ?"
        description="Le fichier PDF de fiche de poste sera définitivement supprimé."
        confirmLabel="Supprimer"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => void handleDelete()}
      />

      <PdfPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        blob={previewResult?.blob ?? null}
        fileName={previewResult?.fileName ?? jobSheet?.fileName ?? 'fiche-de-poste.pdf'}
        title={`Fiche de poste — ${positionTitle}`}
      />
    </div>
  );
}
