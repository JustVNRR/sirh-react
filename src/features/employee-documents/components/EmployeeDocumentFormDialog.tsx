import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, useWatch, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import { toast } from 'sonner';
import { useEmployeesQuery } from '@/features/employees';
import { ApiError } from '@/shared/api/types';
import { usePermission } from '@/shared/auth/AuthContext';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { ALLOWED_DOCUMENT_EXTENSIONS, MAX_FILE_SIZE_BYTES } from '@/shared/lib/file';
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
import {
  CATEGORY_LABELS,
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_TYPES_BY_CATEGORY,
  getWritableCategories,
} from '../constants/taxonomy';
import {
  useCreateEmployeeDocumentMutation,
  useUpdateEmployeeDocumentMutation,
} from '../hooks/useEmployeeDocumentsQueries';
import {
  employeeDocumentSchema,
  type EmployeeDocumentFormValues,
} from '../schemas/employeeDocumentSchemas';
import type {
  EmployeeDocumentCategory,
  EmployeeDocumentDto,
  EmployeeDocumentType,
} from '../types/employeeDocumentTypes';

function SpecializedFields({
  documentType,
  register,
  errors,
}: {
  documentType: EmployeeDocumentType;
  register: UseFormRegister<EmployeeDocumentFormValues>;
  errors: FieldErrors<EmployeeDocumentFormValues>;
}) {
  if (documentType === 'rqthCertificate') {
    return (
      <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-900 dark:bg-amber-950/20">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">
          Suivi RQTH
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField
            id="doc-rqth-expiry"
            label="Date d’expiration RQTH *"
            error={errors.expiryDate?.message}
          >
            <Input id="doc-rqth-expiry" type="date" {...register('expiryDate')} />
          </FormField>
          <FormField
            id="doc-rqth-accommodation"
            label="Aménagement de poste"
            error={errors.workplaceAccommodation?.message}
          >
            <Input
              id="doc-rqth-accommodation"
              placeholder="Poste ergonomique, télétravail..."
              {...register('workplaceAccommodation')}
            />
          </FormField>
        </div>
      </div>
    );
  }

  if (documentType === 'residentPermit') {
    return (
      <div className="space-y-3 rounded-lg border border-indigo-200 bg-indigo-50/50 p-3 dark:border-indigo-900 dark:bg-indigo-950/20">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-800 dark:text-indigo-300">
          Suivi Titre de séjour
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField
            id="doc-permit-number"
            label="Numéro de titre de séjour *"
            error={errors.permitNumber?.message}
          >
            <Input
              id="doc-permit-number"
              placeholder="ex: 99AB123456"
              {...register('permitNumber')}
            />
          </FormField>
          <FormField
            id="doc-permit-expiry"
            label="Date d’expiration *"
            error={errors.expiryDate?.message}
          >
            <Input id="doc-permit-expiry" type="date" {...register('expiryDate')} />
          </FormField>
        </div>
      </div>
    );
  }

  return null;
}

export interface EmployeeDocumentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: EmployeeDocumentDto | null;
  fixedEmployeeId?: string;
  onRefreshRequested: () => void;
}

export function EmployeeDocumentFormDialog({
  open,
  onOpenChange,
  document,
  fixedEmployeeId,
  onRefreshRequested,
}: EmployeeDocumentFormDialogProps) {
  const isEditing = Boolean(document);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Modifier le document' : 'Déposer un document'}</DialogTitle>
          <DialogDescription>
            Formats acceptés : PDF, PNG, JPG, JPEG, WebP (20 Mo maximum).
          </DialogDescription>
        </DialogHeader>

        {open && (
          <EmployeeDocumentForm
            key={`${document?.id ?? 'new'}-${document?.rowVersion ?? ''}-${fixedEmployeeId ?? ''}`}
            onOpenChange={onOpenChange}
            document={document}
            fixedEmployeeId={fixedEmployeeId}
            onRefreshRequested={onRefreshRequested}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function EmployeeDocumentForm({
  onOpenChange,
  document,
  fixedEmployeeId,
  onRefreshRequested,
}: {
  onOpenChange: (open: boolean) => void;
  document: EmployeeDocumentDto | null;
  fixedEmployeeId?: string;
  onRefreshRequested: () => void;
}) {
  const { can } = usePermission();
  const canWriteAll = can(PERMISSIONS.EMPLOYEE_DOCS_WRITE_ALL);
  const canWriteSelf = can(PERMISSIONS.EMPLOYEE_DOCS_WRITE_SELF);
  const writableCategories = getWritableCategories(canWriteAll, canWriteSelf);
  const defaultCategory: EmployeeDocumentCategory = writableCategories[0] ?? 'personalFile';
  const defaultType: EmployeeDocumentType = DOCUMENT_TYPES_BY_CATEGORY[defaultCategory][0] ?? 'cv';

  const employeesQuery = useEmployeesQuery(
    { page: 1, pageSize: 100 },
    canWriteAll && !fixedEmployeeId,
  );
  const createMutation = useCreateEmployeeDocumentMutation();
  const updateMutation = useUpdateEmployeeDocumentMutation();

  const isEditing = Boolean(document);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | undefined>();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [conflictDetected, setConflictDetected] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<EmployeeDocumentFormValues>({
    resolver: zodResolver(employeeDocumentSchema),
    defaultValues: document
      ? {
          employeeId: document.employeeId,
          category: document.category,
          documentType: document.documentType,
          fileDate: document.fileDate,
          commentary: document.commentary ?? '',
          expiryDate:
            document.rqthDetails?.expiryDate ?? document.residentPermitDetails?.expiryDate ?? '',
          workplaceAccommodation: document.rqthDetails?.workplaceAccommodation ?? '',
          permitNumber: document.residentPermitDetails?.permitNumber ?? '',
        }
      : {
          employeeId: fixedEmployeeId ?? '',
          category: defaultCategory,
          documentType: defaultType,
          fileDate: '',
          commentary: '',
          expiryDate: '',
          workplaceAccommodation: '',
          permitNumber: '',
        },
  });

  const selectedCategory = useWatch({ control, name: 'category', defaultValue: defaultCategory });
  const selectedDocumentType = useWatch({
    control,
    name: 'documentType',
    defaultValue: defaultType,
  });
  const availableTypes = DOCUMENT_TYPES_BY_CATEGORY[selectedCategory] ?? [];

  const handleCategoryChange = (nextCategory: EmployeeDocumentCategory) => {
    setValue('category', nextCategory);
    const firstType = DOCUMENT_TYPES_BY_CATEGORY[nextCategory][0];
    if (firstType) {
      setValue('documentType', firstType);
    }
  };

  const onSubmit = async (values: EmployeeDocumentFormValues) => {
    if (!isEditing && !file) {
      setFileError('Un fichier (PDF ou image) est requis.');
      return;
    }
    setFileError(undefined);
    setSubmitError(null);
    setConflictDetected(false);

    const commonPayload = {
      category: values.category,
      documentType: values.documentType,
      fileDate: values.fileDate || null,
      commentary: values.commentary?.trim() || null,
      expiryDate: values.expiryDate || null,
      workplaceAccommodation: values.workplaceAccommodation?.trim() || null,
      permitNumber: values.permitNumber?.trim() || null,
    };

    try {
      if (isEditing && document) {
        await updateMutation.mutateAsync({
          id: document.id,
          payload: { ...commonPayload, rowVersion: document.rowVersion, file },
        });
        toast.success('Document mis à jour.');
      } else if (file) {
        await createMutation.mutateAsync({
          ...commonPayload,
          employeeId: fixedEmployeeId ?? (values.employeeId || null),
          file,
        });
        toast.success('Document déposé avec succès.');
      }
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError && error.isConflict) {
        setConflictDetected(true);
        return;
      }
      setSubmitError(
        error instanceof ApiError ? error.detail : 'Impossible d’enregistrer le document.',
      );
    }
  };

  return (
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

      {!isEditing && !fixedEmployeeId && canWriteAll && (
        <FormField id="doc-employee" label="Collaborateur">
          <Select id="doc-employee" {...register('employeeId')}>
            <option value="">Mon dossier personnel</option>
            {(employeesQuery.data?.items ?? []).map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName}
              </option>
            ))}
          </Select>
        </FormField>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="doc-category" label="Catégorie" error={errors.category?.message}>
          <Select
            id="doc-category"
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value as EmployeeDocumentCategory)}
          >
            {writableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField id="doc-type" label="Type de pièce" error={errors.documentType?.message}>
          <Select id="doc-type" {...register('documentType')}>
            {availableTypes.map((type) => (
              <option key={type} value={type}>
                {DOCUMENT_TYPE_LABELS[type]}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <SpecializedFields documentType={selectedDocumentType} register={register} errors={errors} />

      <FormField id="doc-file-date" label="Date du document (optionnel)">
        <Input id="doc-file-date" type="date" {...register('fileDate')} />
      </FormField>

      <FileDropzone
        id="doc-file-upload"
        label={isEditing ? 'Remplacer le fichier (optionnel)' : 'Sélectionner un fichier'}
        file={file}
        onFileChange={(next) => {
          setFile(next);
          setFileError(undefined);
        }}
        allowedExtensions={ALLOWED_DOCUMENT_EXTENSIONS}
        maxBytes={MAX_FILE_SIZE_BYTES}
        error={fileError}
      />

      <FormField id="doc-commentary" label="Commentaire" error={errors.commentary?.message}>
        <Textarea id="doc-commentary" rows={2} {...register('commentary')} />
      </FormField>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Annuler
        </Button>
        <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
          {isEditing ? 'Enregistrer' : 'Déposer'}
        </Button>
      </DialogFooter>
    </form>
  );
}
