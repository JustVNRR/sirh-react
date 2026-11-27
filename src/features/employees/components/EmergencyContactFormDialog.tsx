import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
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
} from '@/shared/ui';
import {
  useCreateEmergencyContactMutation,
  useUpdateEmergencyContactMutation,
} from '../hooks/useEmergencyContactsQueries';
import {
  emergencyContactSchema,
  type EmergencyContactFormValues,
} from '../schemas/emergencyContactAndPositionSchemas';
import type { EmergencyContactDto } from '../types/employeeTypes';

function toNullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export interface EmergencyContactFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  contact: EmergencyContactDto | null;
  defaultPriority?: number;
}

export function EmergencyContactFormDialog({
  open,
  onOpenChange,
  employeeId,
  contact,
  defaultPriority = 1,
}: EmergencyContactFormDialogProps) {
  const isEditing = Boolean(contact);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier le contact d'urgence" : "Ajouter un contact d'urgence"}
          </DialogTitle>
          <DialogDescription>
            Ces données sont chiffrées en base (maximum 2 contacts par collaborateur).
          </DialogDescription>
        </DialogHeader>

        {open && (
          <EmergencyContactForm
            key={`${contact?.id ?? 'new'}-${contact?.rowVersion ?? ''}-${defaultPriority}`}
            onOpenChange={onOpenChange}
            employeeId={employeeId}
            contact={contact}
            defaultPriority={defaultPriority}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function EmergencyContactForm({
  onOpenChange,
  employeeId,
  contact,
  defaultPriority,
}: {
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  contact: EmergencyContactDto | null;
  defaultPriority: number;
}) {
  const isEditing = Boolean(contact);
  const createMutation = useCreateEmergencyContactMutation(employeeId);
  const updateMutation = useUpdateEmergencyContactMutation(employeeId);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmergencyContactFormValues>({
    resolver: zodResolver(emergencyContactSchema),
    defaultValues: {
      fullName: contact?.fullName ?? '',
      relationship: contact?.relationship ?? '',
      priorityOrder: contact?.priorityOrder ?? defaultPriority,
      mobilePhone: contact?.mobilePhone ?? '',
      homePhone: contact?.homePhone ?? '',
      workPhone: contact?.workPhone ?? '',
    },
  });

  const onSubmit = async (values: EmergencyContactFormValues) => {
    setServerError(null);
    const basePayload = {
      fullName: values.fullName.trim(),
      relationship: values.relationship.trim(),
      priorityOrder: values.priorityOrder,
      mobilePhone: toNullable(values.mobilePhone),
      homePhone: toNullable(values.homePhone),
      workPhone: toNullable(values.workPhone),
    };

    try {
      if (contact) {
        await updateMutation.mutateAsync({
          id: contact.id,
          payload: { ...basePayload, rowVersion: contact.rowVersion },
        });
        toast.success("Contact d'urgence mis à jour.");
      } else {
        await createMutation.mutateAsync(basePayload);
        toast.success("Contact d'urgence ajouté.");
      }
      onOpenChange(false);
    } catch (error) {
      setServerError(
        error instanceof ApiError ? error.detail : "Impossible d'enregistrer ce contact.",
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

      <FormField id="ec-fullName" label="Nom complet" required error={errors.fullName?.message}>
        <Input id="ec-fullName" hasError={Boolean(errors.fullName)} {...register('fullName')} />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id="ec-relationship"
          label="Lien de parenté"
          required
          error={errors.relationship?.message}
        >
          <Input
            id="ec-relationship"
            placeholder="Conjoint, Parent..."
            hasError={Boolean(errors.relationship)}
            {...register('relationship')}
          />
        </FormField>
        <FormField id="ec-priority" label="Priorité" required error={errors.priorityOrder?.message}>
          <Select id="ec-priority" {...register('priorityOrder', { valueAsNumber: true })}>
            <option value={1}>1 (Principal)</option>
            <option value={2}>2 (Secondaire)</option>
          </Select>
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <FormField id="ec-mobile" label="Mobile" error={errors.mobilePhone?.message}>
          <Input
            id="ec-mobile"
            hasError={Boolean(errors.mobilePhone)}
            {...register('mobilePhone')}
          />
        </FormField>
        <FormField id="ec-home" label="Domicile" error={errors.homePhone?.message}>
          <Input id="ec-home" {...register('homePhone')} />
        </FormField>
        <FormField id="ec-work" label="Professionnel" error={errors.workPhone?.message}>
          <Input id="ec-work" {...register('workPhone')} />
        </FormField>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
          Annuler
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {isEditing ? 'Enregistrer' : 'Ajouter'}
        </Button>
      </DialogFooter>
    </form>
  );
}
