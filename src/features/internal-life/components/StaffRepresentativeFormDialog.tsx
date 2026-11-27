import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useEmployeesQuery } from '@/features/employees';
import { useCompaniesQuery } from '@/features/organization';
import { ApiError } from '@/shared/api/types';
import { usePermission } from '@/shared/auth/AuthContext';
import { PERMISSIONS } from '@/shared/auth/permissions';
import {
  Alert,
  Button,
  Checkbox,
  ConcurrencyConflictBanner,
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
  useCreateStaffRepresentativeMutation,
  useUpdateStaffRepresentativeMutation,
} from '../hooks/useCseRseQueries';
import {
  ELECTORAL_COLLEGES,
  ELECTORAL_COLLEGE_LABELS,
  STAFF_REP_ROLES,
  STAFF_REP_ROLE_LABELS,
  staffRepresentativeSchema,
  type StaffRepresentativeFormValues,
} from '../schemas/cseRseSchemas';
import type { StaffRepresentativeDto } from '../types/cseRseTypes';

export interface StaffRepresentativeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  representative: StaffRepresentativeDto | null;
  onRefreshRequested: () => void;
}

export function StaffRepresentativeFormDialog({
  open,
  onOpenChange,
  representative,
  onRefreshRequested,
}: StaffRepresentativeFormDialogProps) {
  const { can } = usePermission();
  const canReadEmployees = can(PERMISSIONS.EMPLOYEES_READ_ALL);
  const companiesQuery = useCompaniesQuery({ page: 1, pageSize: 100 });
  const employeesQuery = useEmployeesQuery({ page: 1, pageSize: 100 }, open && canReadEmployees);
  const createMutation = useCreateStaffRepresentativeMutation();
  const updateMutation = useUpdateStaffRepresentativeMutation();

  const isEditing = Boolean(representative);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [conflictDetected, setConflictDetected] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<StaffRepresentativeFormValues>({
    resolver: zodResolver(staffRepresentativeSchema),
    defaultValues: {
      companyId: '',
      employeeId: '',
      firstName: '',
      lastName: '',
      email: '',
      representativeRole: 'titularDelegate',
      college: 'workersEmployees',
      isHarassmentAdvisor: false,
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    if (representative) {
      reset({
        companyId: representative.companyId,
        employeeId: representative.employeeId ?? '',
        firstName: representative.firstName,
        lastName: representative.lastName,
        email: representative.email,
        representativeRole: representative.representativeRole,
        college: representative.college,
        isHarassmentAdvisor: representative.isHarassmentAdvisor,
      });
    } else {
      reset({
        companyId: '',
        employeeId: '',
        firstName: '',
        lastName: '',
        email: '',
        representativeRole: 'titularDelegate',
        college: 'workersEmployees',
        isHarassmentAdvisor: false,
      });
    }
    setSubmitError(null);
    setConflictDetected(false);
  }, [open, representative, reset]);

  const onSubmit = async (values: StaffRepresentativeFormValues) => {
    setSubmitError(null);
    setConflictDetected(false);

    const payload = {
      companyId: values.companyId,
      employeeId: values.employeeId || null,
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
      representativeRole: values.representativeRole,
      college: values.college,
      isHarassmentAdvisor: values.isHarassmentAdvisor,
    };

    try {
      if (isEditing && representative) {
        await updateMutation.mutateAsync({
          id: representative.id,
          payload: { ...payload, rowVersion: representative.rowVersion },
        });
        toast.success('Représentant mis à jour.');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('Représentant ajouté à l’annuaire.');
      }
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError && error.isConflict) {
        setConflictDetected(true);
        return;
      }
      setSubmitError(
        error instanceof ApiError ? error.detail : 'Impossible d’enregistrer le représentant.',
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifier le représentant CSE' : 'Ajouter un représentant CSE'}
          </DialogTitle>
          <DialogDescription>
            Renseignez les coordonnées et le mandat du représentant ou référent harcèlement.
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
            <Alert variant="danger" title="Opération impossible">
              {submitError}
            </Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="cse-company" label="Entreprise *" error={errors.companyId?.message}>
              <Select id="cse-company" {...register('companyId')}>
                <option value="">Sélectionner...</option>
                {(companiesQuery.data?.items ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </FormField>

            {canReadEmployees && (
              <FormField id="cse-employee" label="Rattacher un collaborateur (optionnel)">
                <Select
                  id="cse-employee"
                  {...register('employeeId', {
                    onChange: (e) => {
                      const empId = (e.target as HTMLSelectElement).value;
                      const found = (employeesQuery.data?.items ?? []).find((x) => x.id === empId);
                      if (found) {
                        setValue('firstName', found.firstName);
                        setValue('lastName', found.lastName);
                        setValue('email', found.email);
                      }
                    },
                  })}
                >
                  <option value="">Saisie manuelle / externe</option>
                  {(employeesQuery.data?.items ?? []).map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName}
                    </option>
                  ))}
                </Select>
              </FormField>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="cse-first-name" label="Prénom *" error={errors.firstName?.message}>
              <Input id="cse-first-name" {...register('firstName')} />
            </FormField>
            <FormField id="cse-last-name" label="Nom *" error={errors.lastName?.message}>
              <Input id="cse-last-name" {...register('lastName')} />
            </FormField>
          </div>

          <FormField id="cse-email" label="Email *" error={errors.email?.message}>
            <Input id="cse-email" type="email" {...register('email')} />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="cse-role" label="Mandat" error={errors.representativeRole?.message}>
              <Select id="cse-role" {...register('representativeRole')}>
                {STAFF_REP_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {STAFF_REP_ROLE_LABELS[role]}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField id="cse-college" label="Collège électoral" error={errors.college?.message}>
              <Select id="cse-college" {...register('college')}>
                {ELECTORAL_COLLEGES.map((col) => (
                  <option key={col} value={col}>
                    {ELECTORAL_COLLEGE_LABELS[col]}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <label
            htmlFor="cse-harassment"
            className="flex items-center gap-2 text-sm text-[var(--foreground)]"
          >
            <Checkbox id="cse-harassment" {...register('isHarassmentAdvisor')} />
            Référent harcèlement sexuel et agissements sexistes
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
              {isEditing ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
