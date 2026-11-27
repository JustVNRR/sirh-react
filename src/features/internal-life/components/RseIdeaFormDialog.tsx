import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useLocationsQuery } from '@/features/organization';
import { ApiError } from '@/shared/api/types';
import { ALLOWED_DOCUMENT_EXTENSIONS, MAX_FILE_SIZE_BYTES } from '@/shared/lib/file';
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
  Input,
  Select,
  Textarea,
} from '@/shared/ui';
import { useCreateRseIdeaMutation, useUpdateRseIdeaMutation } from '../hooks/useCseRseQueries';
import { rseIdeaSchema, type RseIdeaFormValues } from '../schemas/cseRseSchemas';
import type { RseIdeaDto } from '../types/cseRseTypes';

export interface RseIdeaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  idea: RseIdeaDto | null;
  onRefreshRequested: () => void;
}

export function RseIdeaFormDialog({
  open,
  onOpenChange,
  idea,
  onRefreshRequested,
}: RseIdeaFormDialogProps) {
  const isEditing = Boolean(idea);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifier mon idée RSE' : 'Soumettre une idée RSE'}
          </DialogTitle>
          <DialogDescription>
            Proposez une initiative environnementale, sociale ou solidaire pour votre établissement.
          </DialogDescription>
        </DialogHeader>

        {open && (
          <RseIdeaForm
            key={`${idea?.id ?? 'new'}-${idea?.rowVersion ?? ''}`}
            onOpenChange={onOpenChange}
            idea={idea}
            onRefreshRequested={onRefreshRequested}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function RseIdeaForm({
  onOpenChange,
  idea,
  onRefreshRequested,
}: {
  onOpenChange: (open: boolean) => void;
  idea: RseIdeaDto | null;
  onRefreshRequested: () => void;
}) {
  const isEditing = Boolean(idea);
  const locationsQuery = useLocationsQuery({ page: 1, pageSize: 100 });
  const createMutation = useCreateRseIdeaMutation();
  const updateMutation = useUpdateRseIdeaMutation();

  const [file, setFile] = useState<File | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [conflictDetected, setConflictDetected] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RseIdeaFormValues>({
    resolver: zodResolver(rseIdeaSchema),
    defaultValues: idea
      ? {
          locationId: idea.locationId ?? '',
          title: idea.title,
          ideaContent: idea.ideaContent,
        }
      : {
          locationId: '',
          title: '',
          ideaContent: '',
        },
  });

  const onSubmit = async (values: RseIdeaFormValues) => {
    setSubmitError(null);
    setConflictDetected(false);

    const payload = {
      locationId: values.locationId || null,
      title: values.title.trim(),
      ideaContent: values.ideaContent.trim(),
      file,
    };

    try {
      if (isEditing && idea) {
        await updateMutation.mutateAsync({
          id: idea.id,
          payload: { ...payload, rowVersion: idea.rowVersion },
        });
        toast.success('Idée RSE mise à jour.');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('Idée RSE soumise.');
      }
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError && error.isConflict) {
        setConflictDetected(true);
        return;
      }
      setSubmitError(error instanceof ApiError ? error.detail : 'Impossible d’enregistrer l’idée.');
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

      <FormField id="rse-title" label="Titre de l’idée *" error={errors.title?.message}>
        <Input id="rse-title" {...register('title')} />
      </FormField>

      <FormField id="rse-location" label="Lieu / Établissement (optionnel)">
        <Select id="rse-location" {...register('locationId')}>
          <option value="">Tous les établissements</option>
          {(locationsQuery.data?.items ?? []).map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name} ({loc.city})
            </option>
          ))}
        </Select>
      </FormField>

      <FormField id="rse-content" label="Description *" error={errors.ideaContent?.message}>
        <Textarea id="rse-content" rows={4} {...register('ideaContent')} />
      </FormField>

      <FileDropzone
        id="rse-file"
        label={isEditing ? 'Remplacer la pièce jointe (optionnel)' : 'Pièce jointe (optionnel)'}
        file={file}
        onFileChange={setFile}
        allowedExtensions={ALLOWED_DOCUMENT_EXTENSIONS}
        maxBytes={MAX_FILE_SIZE_BYTES}
      />

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Annuler
        </Button>
        <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
          {isEditing ? 'Enregistrer' : 'Soumettre'}
        </Button>
      </DialogFooter>
    </form>
  );
}
