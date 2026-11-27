import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useContractTypesQuery } from '@/features/organization';
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
  Input,
  Select,
  Textarea,
} from '@/shared/ui';
import { useUpdateContractMutation } from '../hooks/useContractsQueries';
import {
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_VALUES,
  editContractSchema,
  type EditContractFormValues,
} from '../schemas/contractSchemas';
import type { ContractDto } from '../types/contractTypes';

export interface EditContractDialogProps {
  contract: ContractDto | null;
  onOpenChange: (open: boolean) => void;
  onRefreshRequested: () => void;
}

export function EditContractDialog({
  contract,
  onOpenChange,
  onRefreshRequested,
}: EditContractDialogProps) {
  const contractTypesQuery = useContractTypesQuery({ page: 1, pageSize: 100 });
  const updateMutation = useUpdateContractMutation();

  const [file, setFile] = useState<File | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [conflictDetected, setConflictDetected] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditContractFormValues>({
    resolver: zodResolver(editContractSchema),
    defaultValues: {
      contractTypeId: '',
      status: 'draft',
      signedAt: '',
      commentary: '',
    },
  });

  useEffect(() => {
    if (contract) {
      reset({
        contractTypeId: contract.contractTypeId,
        status: contract.status,
        signedAt: contract.signedAt ?? '',
        commentary: contract.commentary ?? '',
      });
      setFile(null);
      setSubmitError(null);
      setConflictDetected(false);
    }
  }, [contract, reset]);

  const onSubmit = async (values: EditContractFormValues) => {
    if (!contract) {
      return;
    }
    setSubmitError(null);
    setConflictDetected(false);

    try {
      await updateMutation.mutateAsync({
        id: contract.id,
        payload: {
          contractTypeId: values.contractTypeId,
          status: values.status,
          signedAt: values.signedAt || null,
          commentary: values.commentary?.trim() || null,
          rowVersion: contract.rowVersion,
          file,
        },
      });
      toast.success('Contrat mis à jour.');
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError && error.isConflict) {
        setConflictDetected(true);
        return;
      }
      setSubmitError(
        error instanceof ApiError ? error.detail : 'Impossible de mettre à jour ce contrat.',
      );
    }
  };

  return (
    <Dialog open={Boolean(contract)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Modifier le contrat</DialogTitle>
          <DialogDescription>
            Mettez à jour le statut de signature, le commentaire ou remplacez le fichier PDF.
          </DialogDescription>
        </DialogHeader>

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
            <Alert variant="danger" title="Mise à jour impossible">
              {submitError}
            </Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField
              id="edit-contract-type"
              label="Type de contrat"
              error={errors.contractTypeId?.message}
            >
              <Select id="edit-contract-type" {...register('contractTypeId')}>
                {(contractTypesQuery.data?.items ?? []).map((ct) => (
                  <option key={ct.id} value={ct.id}>
                    {ct.label}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField id="edit-contract-status" label="Statut" error={errors.status?.message}>
              <Select id="edit-contract-status" {...register('status')}>
                {CONTRACT_STATUS_VALUES.map((status) => (
                  <option key={status} value={status}>
                    {CONTRACT_STATUS_LABELS[status]}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField
              id="edit-contract-signed-at"
              label="Date de signature"
              error={errors.signedAt?.message}
            >
              <Input id="edit-contract-signed-at" type="date" {...register('signedAt')} />
            </FormField>
          </div>

          <FileDropzone
            id="edit-contract-file"
            label="Remplacer le PDF (optionnel)"
            file={file}
            onFileChange={setFile}
            allowedExtensions={['.pdf']}
            maxBytes={MAX_FILE_SIZE_BYTES}
          />

          <FormField id="edit-contract-commentary" label="Commentaire">
            <Textarea id="edit-contract-commentary" rows={2} {...register('commentary')} />
          </FormField>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" isLoading={updateMutation.isPending}>
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
