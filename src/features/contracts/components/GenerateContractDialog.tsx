import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { useEmployeesQuery, usePositionsQuery } from '@/features/employees';
import { useContractTypesQuery } from '@/features/organization';
import { ApiError } from '@/shared/api/types';
import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FormField,
  Input,
  Select,
  Textarea,
} from '@/shared/ui';
import {
  useContractModelsQuery,
  useGenerateContractMutation,
} from '../hooks/useContractModelsQueries';
import {
  generateContractSchema,
  type GenerateContractFormValues,
} from '../schemas/contractSchemas';

export interface GenerateContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GenerateContractDialog({ open, onOpenChange }: GenerateContractDialogProps) {
  const modelsQuery = useContractModelsQuery({ active: true, page: 1, pageSize: 100 });
  const employeesQuery = useEmployeesQuery({ page: 1, pageSize: 100 });
  const contractTypesQuery = useContractTypesQuery({ page: 1, pageSize: 100 });

  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const positionsQuery = usePositionsQuery(selectedEmployeeId, Boolean(selectedEmployeeId));
  const generateMutation = useGenerateContractMutation();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<GenerateContractFormValues>({
    resolver: zodResolver(generateContractSchema),
    defaultValues: {
      contractModelId: '',
      positionId: '',
      contractTypeId: '',
      commentary: '',
    },
  });

  const selectedModelId = useWatch({ control, name: 'contractModelId', defaultValue: '' });
  const selectedModel = (modelsQuery.data?.items ?? []).find((m) => m.id === selectedModelId);

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset();
      setSelectedEmployeeId('');
      setCustomValues({});
      setSubmitError(null);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: GenerateContractFormValues) => {
    setSubmitError(null);
    const customPayload: Record<string, string> = {};
    for (const key of selectedModel?.customVariables ?? []) {
      const val = customValues[key]?.trim();
      if (val) {
        customPayload[key] = val;
      }
    }

    try {
      await generateMutation.mutateAsync({
        contractModelId: values.contractModelId,
        positionId: values.positionId,
        contractTypeId: values.contractTypeId,
        customVariables: Object.keys(customPayload).length > 0 ? customPayload : undefined,
        commentary: values.commentary?.trim() || null,
      });
      toast.success('Contrat généré avec succès.');
      handleClose(false);
    } catch (error) {
      if (error instanceof ApiError && error.isConflict) {
        setSubmitError('Ce poste dispose déjà d’un contrat associé (409 Conflict).');
        return;
      }
      setSubmitError(
        error instanceof ApiError ? error.detail : 'Impossible de générer le contrat.',
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Générer un contrat depuis un modèle</DialogTitle>
          <DialogDescription>
            Sélectionnez un modèle Scriban actif et le poste concerné pour produire le PDF.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            handleSubmit(onSubmit)(e).catch(() => undefined);
          }}
          className="space-y-4"
        >
          {submitError && (
            <Alert variant="danger" title="Génération impossible">
              {submitError}
            </Alert>
          )}

          <FormField
            id="gen-contract-model"
            label="Modèle de contrat"
            error={errors.contractModelId?.message}
          >
            <Select
              id="gen-contract-model"
              {...register('contractModelId', {
                onChange: (e) => {
                  const found = (modelsQuery.data?.items ?? []).find(
                    (m) => m.id === (e.target as HTMLSelectElement).value,
                  );
                  if (found?.contractTypeId) {
                    setValue('contractTypeId', found.contractTypeId);
                  }
                },
              })}
            >
              <option value="">Sélectionner un modèle...</option>
              {(modelsQuery.data?.items ?? []).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </Select>
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="gen-employee" label="Collaborateur">
              <Select
                id="gen-employee"
                value={selectedEmployeeId}
                onChange={(e) => {
                  setSelectedEmployeeId(e.target.value);
                  setValue('positionId', '');
                }}
              >
                <option value="">Sélectionner un collaborateur...</option>
                {(employeesQuery.data?.items ?? []).map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField id="gen-position" label="Poste" error={errors.positionId?.message}>
              <Select id="gen-position" disabled={!selectedEmployeeId} {...register('positionId')}>
                <option value="">Sélectionner un poste...</option>
                {(positionsQuery.data ?? []).map((pos) => (
                  <option key={pos.id} value={pos.id}>
                    {pos.jobTitle} ({pos.startAt})
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <FormField
            id="gen-contract-type"
            label="Type de contrat"
            error={errors.contractTypeId?.message}
          >
            <Select id="gen-contract-type" {...register('contractTypeId')}>
              <option value="">Sélectionner un type...</option>
              {(contractTypesQuery.data?.items ?? []).map((ct) => (
                <option key={ct.id} value={ct.id}>
                  {ct.label} ({ct.code})
                </option>
              ))}
            </Select>
          </FormField>

          {selectedModel && selectedModel.customVariables.length > 0 && (
            <div className="grid gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-3 sm:grid-cols-2">
              {selectedModel.customVariables.map((varKey) => (
                <FormField key={varKey} id={`gen-var-${varKey}`} label={varKey}>
                  <Input
                    id={`gen-var-${varKey}`}
                    value={customValues[varKey] ?? ''}
                    onChange={(e) =>
                      setCustomValues((prev) => ({ ...prev, [varKey]: e.target.value }))
                    }
                  />
                </FormField>
              ))}
            </div>
          )}

          <FormField id="gen-commentary" label="Commentaire" error={errors.commentary?.message}>
            <Textarea id="gen-commentary" rows={2} {...register('commentary')} />
          </FormField>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
              Annuler
            </Button>
            <Button type="submit" isLoading={generateMutation.isPending}>
              Générer le contrat
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
