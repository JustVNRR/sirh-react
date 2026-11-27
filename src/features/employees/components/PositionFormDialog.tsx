import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { useDepartmentsQuery, useLocationsQuery } from '@/features/organization';
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
  Select,
} from '@/shared/ui';
import { useEmployeesQuery } from '../hooks/useEmployeesQueries';
import { useCreatePositionMutation, useUpdatePositionMutation } from '../hooks/usePositionsQueries';
import {
  createPositionSchema,
  type PositionFormValues,
} from '../schemas/emergencyContactAndPositionSchemas';
import type { PositionDto } from '../types/employeeTypes';

function toNullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toNullableNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : null;
}

function getDefaults(position: PositionDto | null): PositionFormValues {
  if (!position) {
    return {
      jobTitle: '',
      startAt: '',
      endAt: '',
      managerId: '',
      locationId: '',
      contractLabel: '',
      coefficient: '',
      rate: '',
      supervisor: '',
      timeContractType: '',
      timeContractAmount: '',
      hierarchicalPosition: '',
      departments: [],
    };
  }
  const tcType =
    position.timeContractType === 'Hours' || position.timeContractType === 'Days'
      ? position.timeContractType
      : '';
  return {
    jobTitle: position.jobTitle,
    startAt: position.startAt,
    endAt: position.endAt ?? '',
    managerId: position.managerId ?? '',
    locationId: position.locationId ?? '',
    contractLabel: position.contractLabel ?? '',
    coefficient: position.coefficient ?? '',
    rate: position.rate !== null ? String(position.rate) : '',
    supervisor: position.supervisor ?? '',
    timeContractType: tcType,
    timeContractAmount:
      position.timeContractAmount !== null ? String(position.timeContractAmount) : '',
    hierarchicalPosition: position.hierarchicalPosition ?? '',
    departments: position.departments,
  };
}

export interface PositionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  position: PositionDto | null;
}

export function PositionFormDialog({
  open,
  onOpenChange,
  employeeId,
  position,
}: PositionFormDialogProps) {
  const isEditing = Boolean(position);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Modifier le poste' : 'Nouveau poste'}</DialogTitle>
          <DialogDescription>
            Le poste courant est calculé automatiquement selon les dates de début et de fin.
          </DialogDescription>
        </DialogHeader>

        {open && (
          <PositionForm
            key={`${position?.id ?? 'new'}-${position?.rowVersion ?? ''}`}
            onOpenChange={onOpenChange}
            employeeId={employeeId}
            position={position}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function PositionForm({
  onOpenChange,
  employeeId,
  position,
}: {
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  position: PositionDto | null;
}) {
  const isEditing = Boolean(position);
  const schema = useMemo(() => createPositionSchema(employeeId), [employeeId]);

  const locationsQuery = useLocationsQuery({ page: 1, pageSize: 100 });
  const employeesQuery = useEmployeesQuery({ active: true, page: 1, pageSize: 100 });
  const departmentsQuery = useDepartmentsQuery();
  const createMutation = useCreatePositionMutation(employeeId);
  const updateMutation = useUpdatePositionMutation(employeeId);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PositionFormValues>({
    resolver: zodResolver(schema),
    defaultValues: getDefaults(position),
  });

  const selectedDepartments = useWatch({
    control,
    name: 'departments',
    defaultValue: position?.departments ?? [],
  });

  const toggleDept = (code: string) => {
    const next = selectedDepartments.includes(code)
      ? selectedDepartments.filter((d) => d !== code)
      : [...selectedDepartments, code];
    setValue('departments', next, { shouldValidate: true });
  };

  const onSubmit = async (values: PositionFormValues) => {
    setServerError(null);
    const common = {
      managerId: toNullable(values.managerId),
      locationId: toNullable(values.locationId),
      jobTitle: values.jobTitle.trim(),
      startAt: values.startAt,
      endAt: toNullable(values.endAt),
      contractLabel: toNullable(values.contractLabel),
      coefficient: toNullable(values.coefficient),
      rate: toNullableNumber(values.rate),
      supervisor: toNullable(values.supervisor),
      timeContractType: toNullable(values.timeContractType),
      timeContractAmount: toNullableNumber(values.timeContractAmount),
      hierarchicalPosition: toNullable(values.hierarchicalPosition),
      departments: values.departments,
    };

    try {
      if (position) {
        await updateMutation.mutateAsync({
          id: position.id,
          payload: { ...common, rowVersion: position.rowVersion },
        });
        toast.success('Poste mis à jour.');
      } else {
        await createMutation.mutateAsync({ ...common, employeeId });
        toast.success('Poste créé.');
      }
      onOpenChange(false);
    } catch (error) {
      setServerError(
        error instanceof ApiError ? error.detail : "Impossible d'enregistrer ce poste.",
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
        id="pos-jobTitle"
        label="Intitulé du poste"
        required
        error={errors.jobTitle?.message}
      >
        <Input id="pos-jobTitle" hasError={Boolean(errors.jobTitle)} {...register('jobTitle')} />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="pos-startAt" label="Date de début" required error={errors.startAt?.message}>
          <Input
            id="pos-startAt"
            type="date"
            hasError={Boolean(errors.startAt)}
            {...register('startAt')}
          />
        </FormField>
        <FormField id="pos-endAt" label="Date de fin" error={errors.endAt?.message}>
          <Input
            id="pos-endAt"
            type="date"
            hasError={Boolean(errors.endAt)}
            {...register('endAt')}
          />
        </FormField>
        <FormField id="pos-managerId" label="Manager" error={errors.managerId?.message}>
          <Select
            id="pos-managerId"
            hasError={Boolean(errors.managerId)}
            {...register('managerId')}
          >
            <option value="">Aucun manager</option>
            {employeesQuery.data?.items.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField id="pos-locationId" label="Lieu" error={errors.locationId?.message}>
          <Select id="pos-locationId" {...register('locationId')}>
            <option value="">Non précisé</option>
            {locationsQuery.data?.items.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name} ({loc.city})
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <FormField id="pos-tcType" label="Unité temps" error={errors.timeContractType?.message}>
          <Select id="pos-tcType" {...register('timeContractType')}>
            <option value="">Non précisée</option>
            <option value="Hours">Heures</option>
            <option value="Days">Jours</option>
          </Select>
        </FormField>
        <FormField id="pos-tcAmount" label="Volume" error={errors.timeContractAmount?.message}>
          <Input
            id="pos-tcAmount"
            type="number"
            step="0.5"
            hasError={Boolean(errors.timeContractAmount)}
            {...register('timeContractAmount')}
          />
        </FormField>
        <FormField id="pos-rate" label="Taux / Rémunération" error={errors.rate?.message}>
          <Input
            id="pos-rate"
            type="number"
            step="0.01"
            hasError={Boolean(errors.rate)}
            {...register('rate')}
          />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <FormField id="pos-coeff" label="Coefficient">
          <Input id="pos-coeff" {...register('coefficient')} />
        </FormField>
        <FormField id="pos-hier" label="Position hiérarchique">
          <Input id="pos-hier" placeholder="Cadre, ETAM..." {...register('hierarchicalPosition')} />
        </FormField>
        <FormField id="pos-sup" label="Tuteur / Maître d'app.">
          <Input id="pos-sup" {...register('supervisor')} />
        </FormField>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-[var(--foreground)]">Départements</p>
        <div className="flex flex-wrap gap-3">
          {departmentsQuery.data?.map((dept) => (
            <Checkbox
              key={dept.code}
              id={`pos-dept-${dept.code}`}
              label={dept.label}
              checked={selectedDepartments.includes(dept.code)}
              onChange={() => toggleDept(dept.code)}
            />
          ))}
        </div>
      </div>

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
