import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ApiError } from '@/shared/api/types';
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FormField,
  Input,
} from '@/shared/ui';
import {
  useCreateContractTypeMutation,
  useUpdateContractTypeMutation,
} from '../hooks/useOrganizationQueries';
import { contractTypeSchema, type ContractTypeFormValues } from '../schemas/organizationSchemas';
import type { ContractTypeDto } from '../types/organizationTypes';

export interface ContractTypeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractType: ContractTypeDto | null;
}

export function ContractTypeFormDialog({
  open,
  onOpenChange,
  contractType,
}: ContractTypeFormDialogProps) {
  const isEditing = Boolean(contractType);
  const isSystem = contractType?.isSystem ?? false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? `Modifier ${contractType?.code}` : 'Nouveau type de contrat'}
          </DialogTitle>
          <DialogDescription>
            {isSystem
              ? 'Ce type est protégé par le système : seul son libellé ou son statut actif peut être ajusté.'
              : 'Définissez le code unique et le libellé du type de contrat.'}
          </DialogDescription>
        </DialogHeader>

        {open && (
          <ContractTypeForm
            key={`${contractType?.id ?? 'new'}-${contractType?.rowVersion ?? ''}`}
            onOpenChange={onOpenChange}
            contractType={contractType}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ContractTypeForm({
  onOpenChange,
  contractType,
}: {
  onOpenChange: (open: boolean) => void;
  contractType: ContractTypeDto | null;
}) {
  const isEditing = Boolean(contractType);
  const isSystem = contractType?.isSystem ?? false;
  const createMutation = useCreateContractTypeMutation();
  const updateMutation = useUpdateContractTypeMutation();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContractTypeFormValues>({
    resolver: zodResolver(contractTypeSchema),
    defaultValues: {
      code: contractType?.code ?? '',
      label: contractType?.label ?? '',
      isActive: contractType?.isActive ?? true,
    },
  });

  const onSubmit = async (values: ContractTypeFormValues) => {
    setServerError(null);
    try {
      if (contractType) {
        await updateMutation.mutateAsync({
          id: contractType.id,
          payload: {
            code: isSystem ? contractType.code : values.code.trim(),
            label: values.label.trim(),
            isActive: values.isActive,
            rowVersion: contractType.rowVersion,
          },
        });
        toast.success('Type de contrat mis à jour.');
      } else {
        await createMutation.mutateAsync({
          code: values.code.trim(),
          label: values.label.trim(),
          isActive: values.isActive,
        });
        toast.success('Type de contrat créé.');
      }
      onOpenChange(false);
    } catch (error) {
      setServerError(
        error instanceof ApiError ? error.detail : "Impossible d'enregistrer le type de contrat.",
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4" noValidate>
      {serverError && (
        <Alert variant="danger" title="Erreur">
          {serverError}
        </Alert>
      )}

      <FormField
        id="ct-code"
        label="Code"
        required
        hint={isSystem ? 'Code système immuable.' : 'Lettres, chiffres, _ ou -.'}
        error={errors.code?.message}
      >
        <Input
          id="ct-code"
          className="font-mono uppercase"
          disabled={isSystem}
          hasError={Boolean(errors.code)}
          {...register('code')}
        />
      </FormField>

      <FormField id="ct-label" label="Libellé" required error={errors.label?.message}>
        <Input id="ct-label" hasError={Boolean(errors.label)} {...register('label')} />
      </FormField>

      <Checkbox id="ct-isActive" label="Type de contrat actif" {...register('isActive')} />

      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
          Annuler
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {isEditing ? 'Enregistrer' : 'Créer'}
        </Button>
      </DialogFooter>
    </form>
  );
}
