import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ApiError } from '@/shared/api/types';
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
  useCompaniesQuery,
  useCreateLocationMutation,
  useUpdateLocationMutation,
} from '../hooks/useOrganizationQueries';
import { locationSchema, type LocationFormValues } from '../schemas/organizationSchemas';
import type { LocationDto } from '../types/organizationTypes';

function toNullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getDefaultValues(location: LocationDto | null): LocationFormValues {
  if (!location) {
    return {
      name: '',
      address: '',
      postalCode: '',
      city: '',
      country: 'France',
      departmentCode: '',
      siret: '',
      colorCode: '#4F46E5',
      isPublished: true,
      companyId: '',
    };
  }
  return {
    name: location.name,
    address: location.address,
    postalCode: location.postalCode ?? '',
    city: location.city,
    country: location.country,
    departmentCode: location.departmentCode ?? '',
    siret: location.siret ?? '',
    colorCode: location.colorCode,
    isPublished: location.isPublished,
    companyId: location.companyId ?? '',
  };
}

export interface LocationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: LocationDto | null;
  onReloadRequired: () => Promise<LocationDto | null>;
}

export function LocationFormDialog({
  open,
  onOpenChange,
  location,
  onReloadRequired,
}: LocationFormDialogProps) {
  const isEditing = Boolean(location);
  const companiesQuery = useCompaniesQuery({ active: true, page: 1, pageSize: 100 });
  const createMutation = useCreateLocationMutation();
  const updateMutation = useUpdateLocationMutation();
  const [serverError, setServerError] = useState<string | null>(null);
  const [hasConflict, setHasConflict] = useState(false);
  const [isReloading, setIsReloading] = useState(false);

  const {
    register,
    watch,
    setValue,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LocationFormValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: getDefaultValues(location),
  });

  const watchedColor = watch('colorCode');

  useEffect(() => {
    if (open) {
      reset(getDefaultValues(location));
      setServerError(null);
      setHasConflict(false);
    }
  }, [open, location, reset]);

  const handleReload = async () => {
    setIsReloading(true);
    try {
      const fresh = await onReloadRequired();
      if (fresh) {
        reset(getDefaultValues(fresh));
      }
      setHasConflict(false);
      setServerError(null);
    } finally {
      setIsReloading(false);
    }
  };

  const onSubmit = async (values: LocationFormValues) => {
    setServerError(null);
    setHasConflict(false);

    const basePayload = {
      name: values.name.trim(),
      address: values.address.trim(),
      postalCode: toNullable(values.postalCode),
      city: values.city.trim(),
      country: toNullable(values.country),
      departmentCode: toNullable(values.departmentCode),
      siret: toNullable(values.siret),
      colorCode: values.colorCode.trim().toUpperCase(),
      isPublished: values.isPublished,
      companyId: toNullable(values.companyId),
    };

    try {
      if (location) {
        await updateMutation.mutateAsync({
          id: location.id,
          payload: { ...basePayload, rowVersion: location.rowVersion },
        });
        toast.success('Lieu mis à jour.');
      } else {
        await createMutation.mutateAsync(basePayload);
        toast.success('Lieu créé.');
      }
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError && error.isConflict) {
        setHasConflict(true);
        setServerError(error.detail);
      } else if (error instanceof ApiError) {
        setServerError(error.detail);
      } else {
        setServerError("Impossible d'enregistrer le lieu.");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? `Modifier ${location?.name}` : 'Nouveau lieu'}</DialogTitle>
          <DialogDescription>
            Configurez l&apos;établissement et sa couleur d&apos;identification.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4" noValidate>
          {hasConflict && (
            <ConcurrencyConflictBanner
              message={serverError ?? undefined}
              onReload={() => void handleReload()}
              isReloading={isReloading}
            />
          )}
          {!hasConflict && serverError && (
            <Alert variant="danger" title="Erreur">
              {serverError}
            </Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="loc-name" label="Nom du lieu" required error={errors.name?.message}>
              <Input id="loc-name" hasError={Boolean(errors.name)} {...register('name')} />
            </FormField>

            <FormField
              id="loc-companyId"
              label="Entreprise rattachée"
              error={errors.companyId?.message}
            >
              <Select id="loc-companyId" {...register('companyId')}>
                <option value="">Site partagé (groupe)</option>
                {companiesQuery.data?.items.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <FormField id="loc-address" label="Adresse" required error={errors.address?.message}>
            <Input id="loc-address" hasError={Boolean(errors.address)} {...register('address')} />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField id="loc-postalCode" label="Code postal" error={errors.postalCode?.message}>
              <Input
                id="loc-postalCode"
                hasError={Boolean(errors.postalCode)}
                {...register('postalCode')}
              />
            </FormField>
            <FormField id="loc-city" label="Ville" required error={errors.city?.message}>
              <Input id="loc-city" hasError={Boolean(errors.city)} {...register('city')} />
            </FormField>
            <FormField
              id="loc-departmentCode"
              label="Département"
              error={errors.departmentCode?.message}
            >
              <Input
                id="loc-departmentCode"
                placeholder="75"
                hasError={Boolean(errors.departmentCode)}
                {...register('departmentCode')}
              />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="loc-siret" label="SIRET (optionnel)" error={errors.siret?.message}>
              <Input
                id="loc-siret"
                className="font-mono"
                maxLength={14}
                hasError={Boolean(errors.siret)}
                {...register('siret')}
              />
            </FormField>

            <FormField
              id="loc-colorCode"
              label="Couleur (#RRGGBB)"
              required
              error={errors.colorCode?.message}
            >
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  aria-label="Sélecteur visuel de couleur"
                  value={/^#[0-9A-Fa-f]{6}$/.test(watchedColor) ? watchedColor : '#4F46E5'}
                  onChange={(e) => setValue('colorCode', e.target.value, { shouldValidate: true })}
                  className="h-10 w-12 cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1"
                />
                <Input
                  id="loc-colorCode"
                  className="font-mono"
                  maxLength={7}
                  hasError={Boolean(errors.colorCode)}
                  {...register('colorCode')}
                />
              </div>
            </FormField>
          </div>

          <Checkbox id="loc-isPublished" label="Lieu publié" {...register('isPublished')} />

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {isEditing ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
