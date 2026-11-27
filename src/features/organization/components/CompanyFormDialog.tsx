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
} from '@/shared/ui';
import {
  useCreateCompanyMutation,
  useUpdateCompanyMutation,
} from '../hooks/useOrganizationQueries';
import { companySchema, type CompanyFormValues } from '../schemas/organizationSchemas';
import type { CompanyDto } from '../types/organizationTypes';

function toNullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getDefaultValues(company: CompanyDto | null): CompanyFormValues {
  if (!company) {
    return {
      name: '',
      legalForm: '',
      address: '',
      postalCode: '',
      city: '',
      country: 'France',
      siret: '',
      register: '',
      capital: '',
      collectiveAgreement: 'Syntec',
      owner: '',
      logoUrl: '',
      isActive: true,
    };
  }
  return {
    name: company.name,
    legalForm: company.legalForm ?? '',
    address: company.address,
    postalCode: company.postalCode ?? '',
    city: company.city ?? '',
    country: company.country,
    siret: company.siret,
    register: company.register ?? '',
    capital: company.capital ?? '',
    collectiveAgreement: company.collectiveAgreement,
    owner: company.owner ?? '',
    logoUrl: company.logoUrl ?? '',
    isActive: company.isActive,
  };
}

export interface CompanyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: CompanyDto | null;
  onReloadRequired: () => Promise<CompanyDto | null>;
}

export function CompanyFormDialog({
  open,
  onOpenChange,
  company,
  onReloadRequired,
}: CompanyFormDialogProps) {
  const isEditing = Boolean(company);
  const createMutation = useCreateCompanyMutation();
  const updateMutation = useUpdateCompanyMutation();
  const [serverError, setServerError] = useState<string | null>(null);
  const [hasConflict, setHasConflict] = useState(false);
  const [isReloading, setIsReloading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: getDefaultValues(company),
  });

  useEffect(() => {
    if (open) {
      reset(getDefaultValues(company));
      setServerError(null);
      setHasConflict(false);
    }
  }, [open, company, reset]);

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

  const onSubmit = async (values: CompanyFormValues) => {
    setServerError(null);
    setHasConflict(false);

    const basePayload = {
      name: values.name.trim(),
      legalForm: toNullable(values.legalForm),
      address: values.address.trim(),
      postalCode: toNullable(values.postalCode),
      city: toNullable(values.city),
      country: toNullable(values.country),
      siret: values.siret.trim(),
      register: toNullable(values.register),
      capital: toNullable(values.capital),
      collectiveAgreement: toNullable(values.collectiveAgreement),
      owner: toNullable(values.owner),
      logoUrl: toNullable(values.logoUrl),
    };

    try {
      if (company) {
        await updateMutation.mutateAsync({
          id: company.id,
          payload: { ...basePayload, isActive: values.isActive, rowVersion: company.rowVersion },
        });
        toast.success('Entreprise mise à jour.');
      } else {
        await createMutation.mutateAsync(basePayload);
        toast.success('Entreprise créée.');
      }
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError && error.isConflict) {
        setHasConflict(true);
        setServerError(error.detail);
      } else if (error instanceof ApiError) {
        setServerError(error.detail);
      } else {
        setServerError("Impossible d'enregistrer l'entreprise.");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? `Modifier ${company?.name}` : 'Nouvelle entreprise'}
          </DialogTitle>
          <DialogDescription>
            Renseignez les informations légales de l&apos;entité juridique.
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
            <FormField
              id="company-name"
              label="Raison sociale"
              required
              error={errors.name?.message}
            >
              <Input id="company-name" hasError={Boolean(errors.name)} {...register('name')} />
            </FormField>

            <FormField
              id="company-legalForm"
              label="Forme juridique"
              error={errors.legalForm?.message}
            >
              <Input
                id="company-legalForm"
                placeholder="SAS, SARL..."
                hasError={Boolean(errors.legalForm)}
                {...register('legalForm')}
              />
            </FormField>

            <FormField
              id="company-siret"
              label="SIRET (14 chiffres)"
              required
              error={errors.siret?.message}
            >
              <Input
                id="company-siret"
                className="font-mono"
                maxLength={14}
                hasError={Boolean(errors.siret)}
                {...register('siret')}
              />
            </FormField>

            <FormField
              id="company-collectiveAgreement"
              label="Convention collective"
              error={errors.collectiveAgreement?.message}
            >
              <Input
                id="company-collectiveAgreement"
                hasError={Boolean(errors.collectiveAgreement)}
                {...register('collectiveAgreement')}
              />
            </FormField>
          </div>

          <FormField id="company-address" label="Adresse" required error={errors.address?.message}>
            <Input
              id="company-address"
              hasError={Boolean(errors.address)}
              {...register('address')}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField
              id="company-postalCode"
              label="Code postal"
              error={errors.postalCode?.message}
            >
              <Input
                id="company-postalCode"
                hasError={Boolean(errors.postalCode)}
                {...register('postalCode')}
              />
            </FormField>
            <FormField id="company-city" label="Ville" error={errors.city?.message}>
              <Input id="company-city" hasError={Boolean(errors.city)} {...register('city')} />
            </FormField>
            <FormField id="company-country" label="Pays" error={errors.country?.message}>
              <Input
                id="company-country"
                hasError={Boolean(errors.country)}
                {...register('country')}
              />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField id="company-register" label="RCS" error={errors.register?.message}>
              <Input
                id="company-register"
                hasError={Boolean(errors.register)}
                {...register('register')}
              />
            </FormField>
            <FormField id="company-capital" label="Capital social" error={errors.capital?.message}>
              <Input
                id="company-capital"
                hasError={Boolean(errors.capital)}
                {...register('capital')}
              />
            </FormField>
            <FormField id="company-owner" label="Représentant légal" error={errors.owner?.message}>
              <Input id="company-owner" hasError={Boolean(errors.owner)} {...register('owner')} />
            </FormField>
          </div>

          <FormField id="company-logoUrl" label="URL du logo" error={errors.logoUrl?.message}>
            <Input
              id="company-logoUrl"
              placeholder="https://..."
              hasError={Boolean(errors.logoUrl)}
              {...register('logoUrl')}
            />
          </FormField>

          {isEditing && (
            <Checkbox id="company-isActive" label="Entreprise active" {...register('isActive')} />
          )}

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
