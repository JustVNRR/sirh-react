import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { useCompaniesQuery, useContractTypesQuery } from '@/features/organization';
import { ApiError } from '@/shared/api/types';
import { usePermission } from '@/shared/auth/AuthContext';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { ALLOWED_DOCUMENT_EXTENSIONS, MAX_FILE_SIZE_BYTES } from '@/shared/lib/file';
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
  FileDropzone,
  FormField,
  Input,
  Select,
  Textarea,
} from '@/shared/ui';
import {
  COMMON_DOCUMENT_CATEGORY_LABELS,
  getWritableCommonCategories,
  isWelcomeKitCategory,
} from '../constants/commonDocumentTaxonomy';
import {
  useCreateCommonDocumentMutation,
  useUpdateCommonDocumentMutation,
} from '../hooks/useCommonDocumentsQueries';
import {
  commonDocumentSchema,
  type CommonDocumentFormValues,
} from '../schemas/commonDocumentSchemas';
import type { CommonDocumentCategory, CommonDocumentDto } from '../types/internalLifeTypes';

export interface CommonDocumentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: CommonDocumentDto | null;
  welcomeKitMode?: boolean;
  onRefreshRequested: () => void;
}

export function CommonDocumentFormDialog({
  open,
  onOpenChange,
  document,
  welcomeKitMode = false,
  onRefreshRequested,
}: CommonDocumentFormDialogProps) {
  const isEditing = Boolean(document);
  let dialogTitle = 'Publier un document commun';
  if (isEditing) {
    dialogTitle = 'Modifier le document';
  } else if (welcomeKitMode) {
    dialogTitle = 'Ajouter un kit d’accueil';
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            Formats acceptés : PDF, PNG, JPG, JPEG, WebP (20 Mo maximum).
          </DialogDescription>
        </DialogHeader>

        {open && (
          <CommonDocumentForm
            key={`${document?.id ?? 'new'}-${document?.rowVersion ?? ''}-${String(welcomeKitMode)}`}
            onOpenChange={onOpenChange}
            document={document}
            welcomeKitMode={welcomeKitMode}
            onRefreshRequested={onRefreshRequested}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CommonDocumentForm({
  onOpenChange,
  document,
  welcomeKitMode,
  onRefreshRequested,
}: {
  onOpenChange: (open: boolean) => void;
  document: CommonDocumentDto | null;
  welcomeKitMode: boolean;
  onRefreshRequested: () => void;
}) {
  const { can } = usePermission();
  const canWriteAll = can(PERMISSIONS.COMMON_DOCS_WRITE);
  const canWriteCse = can(PERMISSIONS.COMMON_DOCS_WRITE_CSE);
  const canWriteWelcomeKits = can(PERMISSIONS.WELCOME_KITS_WRITE);

  const writableCategories = getWritableCommonCategories({
    canWriteAll,
    canWriteCse,
    canWriteWelcomeKits,
    welcomeKitOnly: welcomeKitMode,
  });
  const defaultCategory: CommonDocumentCategory =
    writableCategories[0] ?? (welcomeKitMode ? 'welcomeKitBooklet' : 'companyAgreements');

  const companiesQuery = useCompaniesQuery({ page: 1, pageSize: 100 });
  const contractTypesQuery = useContractTypesQuery({ page: 1, pageSize: 100 });
  const createMutation = useCreateCommonDocumentMutation();
  const updateMutation = useUpdateCommonDocumentMutation();

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
  } = useForm<CommonDocumentFormValues>({
    resolver: zodResolver(commonDocumentSchema),
    defaultValues: document
      ? {
          title: document.title,
          category: document.category,
          companyId: document.companyId ?? '',
          contractTypeId: document.contractTypeId ?? '',
          isWelcomeKit: document.isWelcomeKit,
          description: document.description ?? '',
          fileDate: document.fileDate,
        }
      : {
          title: '',
          category: defaultCategory,
          companyId: '',
          contractTypeId: '',
          isWelcomeKit: welcomeKitMode,
          description: '',
          fileDate: '',
        },
  });

  const selectedCategory = useWatch({ control, name: 'category', defaultValue: defaultCategory });
  const isWelcomeKit = useWatch({
    control,
    name: 'isWelcomeKit',
    defaultValue: document?.isWelcomeKit ?? welcomeKitMode,
  });

  const onSubmit = async (values: CommonDocumentFormValues) => {
    if (!isEditing && !file) {
      setFileError('Un fichier est requis.');
      return;
    }
    setFileError(undefined);
    setSubmitError(null);
    setConflictDetected(false);

    const payloadBase = {
      companyId: values.companyId || null,
      contractTypeId: values.contractTypeId || null,
      category: values.category,
      isWelcomeKit: welcomeKitMode || values.isWelcomeKit,
      title: values.title.trim(),
      description: values.description?.trim() || null,
      fileDate: values.fileDate || null,
    };

    try {
      if (isEditing && document) {
        await updateMutation.mutateAsync({
          id: document.id,
          payload: { ...payloadBase, rowVersion: document.rowVersion, file },
        });
        toast.success('Document mis à jour.');
      } else if (file) {
        await createMutation.mutateAsync({ ...payloadBase, file });
        toast.success('Document publié.');
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

      <FormField id="cdoc-title" label="Titre *" error={errors.title?.message}>
        <Input id="cdoc-title" {...register('title')} />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="cdoc-category" label="Catégorie *" error={errors.category?.message}>
          <Select
            id="cdoc-category"
            value={selectedCategory}
            onChange={(e) => {
              const next = e.target.value as CommonDocumentCategory;
              setValue('category', next);
              if (isWelcomeKitCategory(next)) {
                setValue('isWelcomeKit', true);
              }
            }}
          >
            {writableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {COMMON_DOCUMENT_CATEGORY_LABELS[cat]}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField id="cdoc-company" label="Entreprise (optionnel)">
          <Select id="cdoc-company" {...register('companyId')}>
            <option value="">Toutes les entreprises</option>
            {(companiesQuery.data?.items ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {(welcomeKitMode || isWelcomeKit) && (
          <FormField id="cdoc-contract-type" label="Type de contrat ciblé">
            <Select id="cdoc-contract-type" {...register('contractTypeId')}>
              <option value="">Universel (tous contrats)</option>
              {(contractTypesQuery.data?.items ?? []).map((ct) => (
                <option key={ct.id} value={ct.id}>
                  {ct.label} ({ct.code})
                </option>
              ))}
            </Select>
          </FormField>
        )}

        <FormField id="cdoc-date" label="Date du document">
          <Input id="cdoc-date" type="date" {...register('fileDate')} />
        </FormField>
      </div>

      {!welcomeKitMode && (
        <label
          htmlFor="cdoc-is-welcome-kit"
          className="flex items-center gap-2 text-sm text-[var(--foreground)]"
        >
          <Checkbox id="cdoc-is-welcome-kit" {...register('isWelcomeKit')} />
          Inclure également dans les Kits d’accueil
        </label>
      )}

      <FileDropzone
        id="cdoc-file"
        label={isEditing ? 'Remplacer le fichier (optionnel)' : 'Sélectionner un fichier *'}
        file={file}
        onFileChange={(next) => {
          setFile(next);
          setFileError(undefined);
        }}
        allowedExtensions={ALLOWED_DOCUMENT_EXTENSIONS}
        maxBytes={MAX_FILE_SIZE_BYTES}
        error={fileError}
      />

      <FormField id="cdoc-description" label="Description" error={errors.description?.message}>
        <Textarea id="cdoc-description" rows={2} {...register('description')} />
      </FormField>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Annuler
        </Button>
        <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
          {isEditing ? 'Enregistrer' : 'Publier'}
        </Button>
      </DialogFooter>
    </form>
  );
}
