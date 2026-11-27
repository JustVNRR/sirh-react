import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ApiError } from '@/shared/api/types';
import {
  Alert,
  Button,
  ConcurrencyConflictBanner,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FormField,
  Select,
  Textarea,
} from '@/shared/ui';
import { useTreatRseIdeaMutation } from '../hooks/useCseRseQueries';
import {
  RSE_STATUS_LABELS,
  RSE_STATUS_VALUES,
  treatRseIdeaSchema,
  type TreatRseIdeaFormValues,
} from '../schemas/cseRseSchemas';
import type { RseIdeaDto } from '../types/cseRseTypes';

export interface TreatRseIdeaDialogProps {
  idea: RseIdeaDto | null;
  onOpenChange: (open: boolean) => void;
  onRefreshRequested: () => void;
}

export function TreatRseIdeaDialog({
  idea,
  onOpenChange,
  onRefreshRequested,
}: TreatRseIdeaDialogProps) {
  return (
    <Dialog open={Boolean(idea)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Traiter l’idée RSE</DialogTitle>
          <DialogDescription>{idea?.title}</DialogDescription>
        </DialogHeader>

        {idea && (
          <TreatRseIdeaForm
            key={`${idea.id}-${idea.rowVersion}`}
            idea={idea}
            onOpenChange={onOpenChange}
            onRefreshRequested={onRefreshRequested}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function TreatRseIdeaForm({
  idea,
  onOpenChange,
  onRefreshRequested,
}: {
  idea: RseIdeaDto;
  onOpenChange: (open: boolean) => void;
  onRefreshRequested: () => void;
}) {
  const treatMutation = useTreatRseIdeaMutation();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [conflictDetected, setConflictDetected] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TreatRseIdeaFormValues>({
    resolver: zodResolver(treatRseIdeaSchema),
    defaultValues: {
      status: idea.status,
      rhComment: idea.rhComment ?? '',
    },
  });

  const onSubmit = async (values: TreatRseIdeaFormValues) => {
    setSubmitError(null);
    setConflictDetected(false);

    try {
      await treatMutation.mutateAsync({
        id: idea.id,
        payload: {
          status: values.status,
          rhComment: values.rhComment?.trim() || null,
          rowVersion: idea.rowVersion,
        },
      });
      toast.success('Statut de l’idée RSE mis à jour.');
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError && error.isConflict) {
        setConflictDetected(true);
        return;
      }
      setSubmitError(error instanceof ApiError ? error.detail : 'Impossible de statuer.');
    }
  };

  return (
    <form
      onSubmit={(e) => {
        handleSubmit(onSubmit)(e).catch(() => undefined);
      }}
      className="space-y-4"
    >
      {conflictDetected && (
        <ConcurrencyConflictBanner
          onReload={() => {
            setConflictDetected(false);
            onRefreshRequested();
            onOpenChange(false);
          }}
        />
      )}

      {submitError && (
        <Alert variant="danger" title="Opération impossible">
          {submitError}
        </Alert>
      )}

      <FormField id="treat-rse-status" label="Nouveau statut" error={errors.status?.message}>
        <Select id="treat-rse-status" {...register('status')}>
          {RSE_STATUS_VALUES.map((st) => (
            <option key={st} value={st}>
              {RSE_STATUS_LABELS[st]}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField id="treat-rse-comment" label="Commentaire RH" error={errors.rhComment?.message}>
        <Textarea
          id="treat-rse-comment"
          rows={3}
          placeholder="Décision, suite donnée ou motif..."
          {...register('rhComment')}
        />
      </FormField>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Annuler
        </Button>
        <Button type="submit" isLoading={treatMutation.isPending}>
          Enregistrer la décision
        </Button>
      </DialogFooter>
    </form>
  );
}
