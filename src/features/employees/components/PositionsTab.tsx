import { Briefcase, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { ApiError } from '@/shared/api/types';
import { formatDateFr } from '@/shared/lib/format';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  ConfirmDialog,
  EmptyState,
  Spinner,
} from '@/shared/ui';
import { useDeletePositionMutation, usePositionsQuery } from '../hooks/usePositionsQueries';
import type { PositionDto } from '../types/employeeTypes';
import { PositionFormDialog } from './PositionFormDialog';

export function PositionsTab({
  employeeId,
  canWrite,
  renderPositionExtra,
}: {
  employeeId: string;
  canWrite: boolean;
  renderPositionExtra?: (position: PositionDto) => ReactNode;
}) {
  const query = usePositionsQuery(employeeId);
  const deleteMutation = useDeletePositionMutation(employeeId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<PositionDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PositionDto | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (query.isLoading) {
    return <Spinner label="Chargement de l'historique des postes..." />;
  }

  if (query.error) {
    return (
      <Alert variant="danger" title="Erreur">
        {query.error instanceof ApiError
          ? query.error.detail
          : "Impossible de charger l'historique des postes."}
      </Alert>
    );
  }

  const positions = [...(query.data ?? [])].sort((a, b) => b.startAt.localeCompare(a.startAt));

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success('Poste supprimé.');
      setDeleteTarget(null);
    } catch (error) {
      setDeleteError(
        error instanceof ApiError ? error.detail : 'Impossible de supprimer ce poste.',
      );
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[var(--foreground)]">
          {positions.length} affectation{positions.length > 1 ? 's' : ''}
        </p>
        {canWrite && (
          <Button
            size="sm"
            onClick={() => {
              setSelectedPosition(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Ajouter un poste
          </Button>
        )}
      </div>

      {deleteError && (
        <Alert variant="danger" title="Suppression impossible">
          {deleteError}
        </Alert>
      )}

      {positions.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="h-6 w-6" aria-hidden="true" />}
          title="Aucun poste enregistré"
          description="Ajoutez une affectation pour suivre le parcours du collaborateur."
        />
      ) : (
        <div className="space-y-3">
          {positions.map((pos) => (
            <Card key={pos.id} className={pos.isCurrent ? 'border-[var(--primary)]' : undefined}>
              <CardContent className="p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-[var(--foreground)]">{pos.jobTitle}</p>
                      {pos.isCurrent && <Badge variant="success">Poste actuel</Badge>}
                      {pos.hierarchicalPosition && (
                        <Badge variant="neutral">{pos.hierarchicalPosition}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Du {formatDateFr(pos.startAt)} au{' '}
                      {pos.endAt ? formatDateFr(pos.endAt) : 'Poste ouvert'}
                    </p>
                    {pos.timeContractType && pos.timeContractAmount !== null && (
                      <p className="text-xs text-[var(--muted-foreground)]">
                        Temps de travail : {pos.timeContractAmount}{' '}
                        {pos.timeContractType === 'Hours' ? 'heures' : 'jours'}
                        {pos.coefficient ? ` · Coeff. ${pos.coefficient}` : ''}
                      </p>
                    )}
                  </div>
                  {canWrite && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Modifier le poste ${pos.jobTitle}`}
                        onClick={() => {
                          setSelectedPosition(pos);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Supprimer le poste ${pos.jobTitle}`}
                        onClick={() => {
                          setDeleteError(null);
                          setDeleteTarget(pos);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-[var(--danger)]" aria-hidden="true" />
                      </Button>
                    </div>
                  )}
                </div>
                {renderPositionExtra?.(pos)}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PositionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        employeeId={employeeId}
        position={selectedPosition}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title={`Supprimer le poste ${deleteTarget?.jobTitle ?? ''} ?`}
        description="La suppression est refusée (409) si un contrat ou une fiche de poste est lié à cette affectation."
        confirmLabel="Supprimer"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => void handleConfirmDelete()}
      />
    </div>
  );
}
