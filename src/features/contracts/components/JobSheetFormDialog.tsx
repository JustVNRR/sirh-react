import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ApiError } from '@/shared/api/types';
import { MAX_FILE_SIZE_BYTES } from '@/shared/lib/file';
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
  FileDropzone,
  FormField,
  Textarea,
} from '@/shared/ui';
import { useCreateJobSheetMutation, useUpdateJobSheetMutation } from '../hooks/useJobSheetsQueries';
import { jobSheetSchema, type JobSheetFormValues } from '../schemas/contractSchemas';
import type { JobSheetDto } from '../types/contractTypes';

export interface JobSheetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  positionId: string;
  positionTitle: string;
  jobSheet: JobSheetDto | null;
  onRefreshRequested: () => void;
}

export function JobSheetFormDialog({
  open,
  onOpenChange,
  positionId,
  positionTitle,
  jobSheet,
  onRefreshRequested,
}: JobSheetFormDialogProps) {
  const isEditing = Boolean(jobSheet);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? `Mettre à jour la fiche de poste` : `Ajouter une fiche de poste`}
          </DialogTitle>
          <DialogDescription>Poste : {positionTitle} (format PDF, max 20 Mo).</DialogDescription>
        </DialogHeader>

        {open && (
          <JobSheetForm
            key={`${positionId}-${jobSheet?.id ?? 'new'}-${jobSheet?.rowVersion ?? ''}`}
            onOpenChange={onOpenChange}
            positionId={positionId}
            jobSheet={jobSheet}
            onRefreshRequested={onRefreshRequested}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function JobSheetForm({
  onOpenChange,
  positionId,
  jobSheet,
  onRefreshRequested,
}: {
  onOpenChange: (open: boolean) => void;
  positionId: string;
  jobSheet: JobSheetDto | null;
  onRefreshRequested: () => void;
}) {
  const isEditing = Boolean(jobSheet);
  const createMutation = useCreateJobSheetMutation();
  const updateMutation = useUpdateJobSheetMutation();

  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | undefined>();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [conflictDetected, setConflictDetected] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JobSheetFormValues>({
    resolver: zodResolver(jobSheetSchema),
    defaultValues: { commentary: jobSheet?.commentary ?? '' },
  });

  const onSubmit = async (values: JobSheetFormValues) => {
    if (!isEditing && !file) {
      setFileError('Un fichier PDF est requis pour créer la fiche de poste.');
      return;
    }
    setFileError(undefined);
    setSubmitError(null);
    setConflictDetected(false);

    try {
      if (isEditing && jobSheet) {
        await updateMutation.mutateAsync({
          id: jobSheet.id,
          payload: {
            commentary: values.commentary?.trim() || null,
            rowVersion: jobSheet.rowVersion,
            file,
          },
        });
        toast.success('Fiche de poste mise à jour.');
      } else if (file) {
        await createMutation.mutateAsync({
          positionId,
          commentary: values.commentary?.trim() || null,
          file,
        });
        toast.success('Fiche de poste ajoutée.');
      }
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError && error.isConflict) {
        setConflictDetected(true);
        return;
      }
      setSubmitError(
        error instanceof ApiError ? error.detail : 'Impossible d’enregistrer la fiche de poste.',
      );
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
        <Alert variant="danger" title="Enregistrement impossible">
          {submitError}
        </Alert>
      )}

      <FileDropzone
        id={`jobsheet-file-${positionId}`}
        label={isEditing ? 'Remplacer le PDF (optionnel)' : 'Sélectionner la fiche de poste PDF'}
        file={file}
        onFileChange={(next) => {
          setFile(next);
          setFileError(undefined);
        }}
        allowedExtensions={['.pdf']}
        maxBytes={MAX_FILE_SIZE_BYTES}
        error={fileError}
      />

      <FormField
        id={`jobsheet-commentary-${positionId}`}
        label="Commentaire"
        error={errors.commentary?.message}
      >
        <Textarea id={`jobsheet-commentary-${positionId}`} rows={2} {...register('commentary')} />
      </FormField>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Annuler
        </Button>
        <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
          {isEditing ? 'Mettre à jour' : 'Enregistrer'}
        </Button>
      </DialogFooter>
    </form>
  );
}
