import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useCompaniesQuery, useDepartmentsQuery } from '@/features/organization';
import { useRolesListQuery } from '@/features/roles';
import { ApiError } from '@/shared/api/types';
import { usePermission } from '@/shared/auth/AuthContext';
import { PERMISSIONS } from '@/shared/auth/permissions';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  ConcurrencyConflictBanner,
  FormField,
  Input,
  PageHeader,
  PasswordInput,
  Select,
  Spinner,
} from '@/shared/ui';
import { employeesApi } from '../api/employeesApi';
import {
  useCreateEmployeeMutation,
  useEmployeeDetailQuery,
  useEmployeesQuery,
  useUpdateEmployeeMutation,
} from '../hooks/useEmployeesQueries';
import {
  HONORIFIC_VALUES,
  PRIVILEGED_ROLES,
  createEmployeeSchema,
  updateEmployeeSchema,
  type CreateEmployeeFormValues,
  type UpdateEmployeeFormValues,
} from '../schemas/employeeSchemas';
import type { EmployeeDetailDto } from '../types/employeeTypes';

function toNullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function buildDefaults(employee?: EmployeeDetailDto | null): CreateEmployeeFormValues {
  if (!employee) {
    return {
      companyId: '',
      directManagerId: '',
      honorific: 'M',
      firstName: '',
      lastName: '',
      password: '',
      roleCodes: ['EMPLOYEE'],
      bornAt: '',
      birthPlace: '',
      birthDepartmentCode: '',
      nationalId: '',
      landline: '',
      mobile: '',
      personalEmail: '',
      personalLandline: '',
      personalMobile: '',
      street: '',
      postalCode: '',
      city: '',
      additionalInfo: '',
      departments: [],
    };
  }
  const matchedHonorific = HONORIFIC_VALUES.find((h) => h === employee.honorific) ?? 'M';
  return {
    companyId: employee.companyId,
    directManagerId: employee.directManagerId ?? '',
    honorific: matchedHonorific,
    firstName: employee.firstName,
    lastName: employee.lastName,
    password: '',
    roleCodes: employee.roles.length > 0 ? employee.roles : ['EMPLOYEE'],
    bornAt: employee.bornAt ?? '',
    birthPlace: employee.birthPlace ?? '',
    birthDepartmentCode: employee.birthDepartmentCode ?? '',
    nationalId: employee.nationalId ?? '',
    landline: employee.landline ?? '',
    mobile: employee.mobile ?? '',
    personalEmail: employee.personalEmail ?? '',
    personalLandline: employee.personalLandline ?? '',
    personalMobile: employee.personalMobile ?? '',
    street: employee.address?.street ?? '',
    postalCode: employee.address?.postalCode ?? '',
    city: employee.address?.city ?? '',
    additionalInfo: employee.address?.additionalInfo ?? '',
    departments: employee.departments,
  };
}

function buildAddressPayload(values: UpdateEmployeeFormValues) {
  const street = toNullable(values.street);
  const postalCode = toNullable(values.postalCode);
  const city = toNullable(values.city);
  const additionalInfo = toNullable(values.additionalInfo);
  if (!street && !postalCode && !city && !additionalInfo) {
    return null;
  }
  return { street, postalCode, city, additionalInfo };
}

export function EmployeeFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { can } = usePermission();
  const canManagePrivileged = can(PERMISSIONS.EMPLOYEES_MANAGE_PRIVILEGED);

  const detailQuery = useEmployeeDetailQuery(id);
  const companiesQuery = useCompaniesQuery({ active: true, page: 1, pageSize: 100 });
  const managersQuery = useEmployeesQuery({ active: true, page: 1, pageSize: 100 });
  const departmentsQuery = useDepartmentsQuery();
  const rolesQuery = useRolesListQuery();

  const createMutation = useCreateEmployeeMutation();
  const updateMutation = useUpdateEmployeeMutation();

  const [serverError, setServerError] = useState<string | null>(null);
  const [hasConflict, setHasConflict] = useState(false);
  const [isReloading, setIsReloading] = useState(false);

  const schema = isEditing ? updateEmployeeSchema : createEmployeeSchema;
  const {
    register,
    control,
    setValue,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateEmployeeFormValues>({
    resolver: zodResolver(schema as typeof createEmployeeSchema),
    defaultValues: buildDefaults(null),
  });

  useEffect(() => {
    if (isEditing && detailQuery.data) {
      reset(buildDefaults(detailQuery.data));
    }
  }, [isEditing, detailQuery.data, reset]);

  const selectedRoles = useWatch({ control, name: 'roleCodes', defaultValue: ['EMPLOYEE'] });
  const selectedDepartments = useWatch({ control, name: 'departments', defaultValue: [] });

  const toggleSelection = (field: 'roleCodes' | 'departments', code: string) => {
    const current = field === 'roleCodes' ? selectedRoles : selectedDepartments;
    const next = current.includes(code)
      ? current.filter((item) => item !== code)
      : [...current, code];
    setValue(field, next, { shouldValidate: true });
  };

  const handleReload = async () => {
    if (!id) {
      return;
    }
    setIsReloading(true);
    try {
      const fresh = await employeesApi.getById(id);
      reset(buildDefaults(fresh));
      setHasConflict(false);
      setServerError(null);
    } finally {
      setIsReloading(false);
    }
  };

  const onSubmit = async (values: CreateEmployeeFormValues) => {
    setServerError(null);
    setHasConflict(false);

    const common = {
      companyId: values.companyId,
      directManagerId: toNullable(values.directManagerId),
      honorific: values.honorific,
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      roleCodes: values.roleCodes,
      bornAt: toNullable(values.bornAt),
      birthPlace: toNullable(values.birthPlace),
      birthDepartmentCode: toNullable(values.birthDepartmentCode),
      nationalId: toNullable(values.nationalId),
      landline: toNullable(values.landline),
      mobile: toNullable(values.mobile),
      personalEmail: toNullable(values.personalEmail),
      personalLandline: toNullable(values.personalLandline),
      personalMobile: toNullable(values.personalMobile),
      address: buildAddressPayload(values),
      departments: values.departments,
    };

    try {
      if (isEditing && id && detailQuery.data) {
        const updated = await updateMutation.mutateAsync({
          id,
          payload: { ...common, rowVersion: detailQuery.data.rowVersion },
        });
        toast.success('Fiche collaborateur mise à jour.');
        navigate(`/employees/${updated.id}`);
      } else {
        const created = await createMutation.mutateAsync({
          ...common,
          password: values.password,
        });
        toast.success(`Collaborateur créé (${created.email}).`);
        navigate(`/employees/${created.id}`);
      }
    } catch (error) {
      if (error instanceof ApiError && error.isConflict) {
        setHasConflict(true);
        setServerError(error.detail);
      } else if (error instanceof ApiError) {
        setServerError(error.detail);
      } else {
        setServerError("Impossible d'enregistrer la fiche collaborateur.");
      }
    }
  };

  if (isEditing && detailQuery.isLoading) {
    return <Spinner label="Chargement de la fiche collaborateur..." />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title={isEditing ? 'Modifier le collaborateur' : 'Nouveau collaborateur'}
        description="L'email professionnel et le slug sont générés automatiquement côté serveur."
        actions={
          <Button variant="outline" asChild>
            <Link to={isEditing && id ? `/employees/${id}` : '/employees'}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Retour
            </Link>
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
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

        <Card>
          <CardHeader>
            <CardTitle>Identité</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <FormField
              id="emp-honorific"
              label="Civilité"
              required
              error={errors.honorific?.message}
            >
              <Select id="emp-honorific" {...register('honorific')}>
                {HONORIFIC_VALUES.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField id="emp-firstName" label="Prénom" required error={errors.firstName?.message}>
              <Input
                id="emp-firstName"
                hasError={Boolean(errors.firstName)}
                {...register('firstName')}
              />
            </FormField>
            <FormField id="emp-lastName" label="Nom" required error={errors.lastName?.message}>
              <Input
                id="emp-lastName"
                hasError={Boolean(errors.lastName)}
                {...register('lastName')}
              />
            </FormField>
            <FormField id="emp-bornAt" label="Date de naissance" error={errors.bornAt?.message}>
              <Input id="emp-bornAt" type="date" {...register('bornAt')} />
            </FormField>
            <FormField
              id="emp-birthPlace"
              label="Lieu de naissance"
              error={errors.birthPlace?.message}
            >
              <Input id="emp-birthPlace" {...register('birthPlace')} />
            </FormField>
            <FormField
              id="emp-nationalId"
              label="N° Sécurité sociale (NIR)"
              error={errors.nationalId?.message}
            >
              <Input id="emp-nationalId" className="font-mono" {...register('nationalId')} />
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Affectation & Accès</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                id="emp-companyId"
                label="Entreprise"
                required
                error={errors.companyId?.message}
              >
                <Select
                  id="emp-companyId"
                  hasError={Boolean(errors.companyId)}
                  {...register('companyId')}
                >
                  <option value="">Sélectionner une entreprise</option>
                  {companiesQuery.data?.items.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField
                id="emp-directManagerId"
                label="Manager direct"
                error={errors.directManagerId?.message}
              >
                <Select id="emp-directManagerId" {...register('directManagerId')}>
                  <option value="">Aucun manager</option>
                  {managersQuery.data?.items
                    .filter((m) => m.id !== id)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.firstName} {m.lastName}
                      </option>
                    ))}
                </Select>
              </FormField>
            </div>

            {!isEditing && (
              <FormField
                id="emp-password"
                label="Mot de passe initial"
                required
                hint="Minimum 10 caractères, majuscule, minuscule, chiffre et caractère spécial."
                error={errors.password?.message}
              >
                <PasswordInput
                  id="emp-password"
                  hasError={Boolean(errors.password)}
                  {...register('password')}
                />
              </FormField>
            )}

            <div className="space-y-2">
              <p className="text-sm font-medium text-[var(--foreground)]">Rôles attribués *</p>
              <div className="flex flex-wrap gap-3">
                {rolesQuery.data?.map((role) => {
                  const isPrivileged = PRIVILEGED_ROLES.includes(role.code);
                  const disabled = isPrivileged && !canManagePrivileged;
                  return (
                    <Checkbox
                      key={role.id}
                      id={`role-${role.code}`}
                      label={role.name}
                      disabled={disabled}
                      checked={selectedRoles.includes(role.code)}
                      onChange={() => toggleSelection('roleCodes', role.code)}
                    />
                  );
                })}
              </div>
              {errors.roleCodes?.message && (
                <p role="alert" className="text-xs font-medium text-[var(--danger)]">
                  {errors.roleCodes.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-[var(--foreground)]">Départements</p>
              <div className="flex flex-wrap gap-3">
                {departmentsQuery.data?.map((dept) => (
                  <Checkbox
                    key={dept.code}
                    id={`dept-${dept.code}`}
                    label={dept.label}
                    checked={selectedDepartments.includes(dept.code)}
                    onChange={() => toggleSelection('departments', dept.code)}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Coordonnées & Adresse</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <FormField id="emp-mobile" label="Mobile pro" error={errors.mobile?.message}>
              <Input id="emp-mobile" {...register('mobile')} />
            </FormField>
            <FormField id="emp-landline" label="Fixe pro" error={errors.landline?.message}>
              <Input id="emp-landline" {...register('landline')} />
            </FormField>
            <FormField
              id="emp-personalEmail"
              label="Email personnel"
              error={errors.personalEmail?.message}
            >
              <Input id="emp-personalEmail" type="email" {...register('personalEmail')} />
            </FormField>
            <FormField id="emp-street" label="Rue" className="sm:col-span-2">
              <Input id="emp-street" {...register('street')} />
            </FormField>
            <FormField id="emp-postalCode" label="Code postal">
              <Input id="emp-postalCode" {...register('postalCode')} />
            </FormField>
            <FormField id="emp-city" label="Ville">
              <Input id="emp-city" {...register('city')} />
            </FormField>
            <FormField
              id="emp-additionalInfo"
              label="Complément d'adresse"
              className="sm:col-span-2"
            >
              <Input id="emp-additionalInfo" {...register('additionalInfo')} />
            </FormField>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" asChild>
            <Link to={isEditing && id ? `/employees/${id}` : '/employees'}>Annuler</Link>
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEditing ? 'Enregistrer les modifications' : 'Créer le collaborateur'}
          </Button>
        </div>
      </form>
    </div>
  );
}
