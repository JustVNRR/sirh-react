import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useEmployeesQuery, usePositionsQuery } from '@/features/employees';
import { useContractTypesQuery } from '@/features/organization';
import { ApiError } from '@/shared/api/types';
import { MAX_FILE_SIZE_BYTES } from '@/shared/lib/file';
import {
  Alert,
  Button,
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
import { useImportContractMutation } from '../hooks/useContractsQueries';
import {
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_VALUES,
  importContractSchema,
  type ImportContractFormValues,
} from '../schemas/contractSchemas';

export interface ImportContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportContractDialog({ open, onOpenChange }: ImportContractDialogProps) {
  const employeesQuery = useEmployeesQuery({ page: 1, pageSize: 100 });
  const contractTypesQuery = useContractTypesQuery({ page: 1, pageSize: 100 });

  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | undefined>();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const positionsQuery = usePositionsQuery(selectedEmployeeId, Boolean(selectedEmployeeId));
  const importMutation = useImportContractMutation();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ImportContractFormValues>({
    resolver: zodResolver(importContractSchema),
    defaultValues: {
      positionId: '',
      contractTypeId: '',
      status: 'draft',
      signedAt: '',
      commentary: '',
    },
  });

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset();
      setSelectedEmployeeId('');
      setFile(null);
      setFileError(undefined);
      setSubmitError(null);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: ImportContractFormValues) => {
    if (!file) {
      setFileError('Un fichier PDF est requis.');
      return;
    }
    setFileError(undefined);
    setSubmitError(null);

    try {
      await importMutation.mutateAsync({
        positionId: values.positionId,
        contractTypeId: values.contractTypeId,
        status: values.status,
        signedAt: values.signedAt || null,
        commentary: values.commentary?.trim() || null,
        file,
      });
      toast.success('Contrat PDF importé.');
      handleClose(false);
    } catch (error) {
      if (error instanceof ApiError && error.isConflict) {
        setSubmitError('Ce poste dispose déjà d’un contrat associé (409 Conflict).');
        return;
      }
      setSubmitError(
        error instanceof ApiError ? error.detail : 'Impossible d’importer le contrat.',
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Importer un contrat PDF</DialogTitle>
          <DialogDescription>
            Déposez un contrat déjà rédigé ou signé au format PDF (max 20 Mo).
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            handleSubmit(onSubmit)(e).catch(() => undefined);
          }}
          className="space-y-4"
        >
          {submitError && (
            <Alert variant="danger" title="Import impossible">
              {submitError}
            </Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="imp-employee" label="Collaborateur">
              <Select
                id="imp-employee"
                value={selectedEmployeeId}
                onChange={(e) => {
                  setSelectedEmployeeId(e.target.value);
                  setValue('positionId', '');
                }}
              >
                <option value="">Sélectionner...</option>
                {(employeesQuery.data?.items ?? []).map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField id="imp-position" label="Poste" error={errors.positionId?.message}>
              <Select id="imp-position" disabled={!selectedEmployeeId} {...register('positionId')}>
                <option value="">Sélectionner...</option>
                {(positionsQuery.data ?? []).map((pos) => (
                  <option key={pos.id} value={pos.id}>
                    {pos.jobTitle} ({pos.startAt})
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField
              id="imp-contract-type"
              label="Type de contrat"
              error={errors.contractTypeId?.message}
            >
              <Select id="imp-contract-type" {...register('contractTypeId')}>
                <option value="">Sélectionner...</option>
                {(contractTypesQuery.data?.items ?? []).map((ct) => (
                  <option key={ct.id} value={ct.id}>
                    {ct.label}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField id="imp-status" label="Statut" error={errors.status?.message}>
              <Select id="imp-status" {...register('status')}>
                {CONTRACT_STATUS_VALUES.map((status) => (
                  <option key={status} value={status}>
                    {CONTRACT_STATUS_LABELS[status]}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField
              id="imp-signed-at"
              label="Date de signature"
              error={errors.signedAt?.message}
            >
              <Input id="imp-signed-at" type="date" {...register('signedAt')} />
            </FormField>
          </div>

          <FileDropzone
            id="imp-contract-file"
            label="Sélectionner le contrat PDF"
            file={file}
            onFileChange={(next) => {
              setFile(next);
              setFileError(undefined);
            }}
            allowedExtensions={['.pdf']}
            maxBytes={MAX_FILE_SIZE_BYTES}
            error={fileError}
          />

          <FormField id="imp-commentary" label="Commentaire" error={errors.commentary?.message}>
            <Textarea id="imp-commentary" rows={2} {...register('commentary')} />
          </FormField>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
              Annuler
            </Button>
            <Button type="submit" isLoading={importMutation.isPending}>
              Importer le contrat
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
