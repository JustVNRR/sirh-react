import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useEmployeesQuery } from '@/features/employees';
import { ApiError } from '@/shared/api/types';
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
  useCreateMedicalVisitMutation,
  useUpdateMedicalVisitMutation,
} from '../hooks/useMedicalVisitsQueries';
import {
  MEDICAL_VISIT_TYPES,
  MEDICAL_VISIT_TYPE_LABELS,
  medicalVisitCreateSchema,
  type MedicalVisitCreateFormValues,
} from '../schemas/medicalVisitSchemas';
import type { MedicalVisitDto } from '../types/medicalVisitTypes';

function toLocalDateTimeInput(isoUtc: string): string {
  const d = new Date(isoUtc);
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export interface MedicalVisitFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visit: MedicalVisitDto | null;
  onRefreshRequested: () => void;
}

export function MedicalVisitFormDialog({
  open,
  onOpenChange,
  visit,
  onRefreshRequested,
}: MedicalVisitFormDialogProps) {
  const isEditing = Boolean(visit);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifier la visite médicale' : 'Planifier une visite médicale'}
          </DialogTitle>
          <DialogDescription>
            La convocation est obligatoire à la création. Le rapport d’aptitude peut être ajouté
            ultérieurement.
          </DialogDescription>
        </DialogHeader>

        {open && (
          <MedicalVisitForm
            key={`${visit?.id ?? 'new'}-${visit?.rowVersion ?? ''}`}
            onOpenChange={onOpenChange}
            visit={visit}
            onRefreshRequested={onRefreshRequested}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function MedicalVisitForm({
  onOpenChange,
  visit,
  onRefreshRequested,
}: {
  onOpenChange: (open: boolean) => void;
  visit: MedicalVisitDto | null;
  onRefreshRequested: () => void;
}) {
  const isEditing = Boolean(visit);
  const employeesQuery = useEmployeesQuery({ page: 1, pageSize: 100 }, !isEditing);
  const createMutation = useCreateMedicalVisitMutation();
  const updateMutation = useUpdateMedicalVisitMutation();

  const [convocationFile, setConvocationFile] = useState<File | null>(null);
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [convocationError, setConvocationError] = useState<string | undefined>();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [conflictDetected, setConflictDetected] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MedicalVisitCreateFormValues>({
    resolver: zodResolver(medicalVisitCreateSchema),
    defaultValues: visit
      ? {
          employeeId: visit.employeeId,
          visitType: visit.visitType,
          visitDateTimeLocal: toLocalDateTimeInput(visit.visitDateTimeUtc),
          validityDate: visit.validityDate ?? '',
          medicalCenter: visit.medicalCenter ?? '',
          carriedOut: visit.carriedOut,
          comments: visit.comments ?? '',
        }
      : {
          employeeId: '',
          visitType: 'followUp',
          visitDateTimeLocal: '',
          validityDate: '',
          medicalCenter: '',
          carriedOut: false,
          comments: '',
        },
  });

  const onSubmit = async (values: MedicalVisitCreateFormValues) => {
    if (!isEditing && !convocationFile) {
      setConvocationError('Le fichier de convocation est obligatoire.');
      return;
    }
    setConvocationError(undefined);
    setSubmitError(null);
    setConflictDetected(false);

    const visitDateTimeUtc = new Date(values.visitDateTimeLocal).toISOString();

    try {
      if (isEditing && visit) {
        await updateMutation.mutateAsync({
          id: visit.id,
          payload: {
            visitType: values.visitType,
            visitDateTimeUtc,
            validityDate: values.validityDate || null,
            medicalCenter: values.medicalCenter?.trim() || null,
            carriedOut: values.carriedOut,
            comments: values.comments?.trim() || null,
            rowVersion: visit.rowVersion,
            convocationFile,
            reportFile,
          },
        });
        toast.success('Visite médicale mise à jour.');
      } else if (convocationFile) {
        await createMutation.mutateAsync({
          employeeId: values.employeeId,
          visitType: values.visitType,
          visitDateTimeUtc,
          validityDate: values.validityDate || null,
          medicalCenter: values.medicalCenter?.trim() || null,
          carriedOut: values.carriedOut,
          comments: values.comments?.trim() || null,
          convocationFile,
          reportFile,
        });
        toast.success('Visite médicale planifiée.');
      }
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError && error.isConflict) {
        setConflictDetected(true);
        return;
      }
      setSubmitError(
        error instanceof ApiError ? error.detail : 'Impossible d’enregistrer la visite médicale.',
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
        <Alert variant="danger" title="Enregistrement impossible">
          {submitError}
        </Alert>
      )}

      {!isEditing && (
        <FormField id="mv-employee" label="Collaborateur" error={errors.employeeId?.message}>
          <Select id="mv-employee" {...register('employeeId')}>
            <option value="">Sélectionner un collaborateur...</option>
            {(employeesQuery.data?.items ?? []).map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName}
              </option>
            ))}
          </Select>
        </FormField>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="mv-type" label="Type de visite" error={errors.visitType?.message}>
          <Select id="mv-type" {...register('visitType')}>
            {MEDICAL_VISIT_TYPES.map((type) => (
              <option key={type} value={type}>
                {MEDICAL_VISIT_TYPE_LABELS[type]}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          id="mv-datetime"
          label="Date et heure *"
          error={errors.visitDateTimeLocal?.message}
        >
          <Input id="mv-datetime" type="datetime-local" {...register('visitDateTimeLocal')} />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="mv-center" label="Centre médical" error={errors.medicalCenter?.message}>
          <Input id="mv-center" placeholder="ex: AST Grand Paris" {...register('medicalCenter')} />
        </FormField>

        <FormField id="mv-validity" label="Date de validité" error={errors.validityDate?.message}>
          <Input id="mv-validity" type="date" {...register('validityDate')} />
        </FormField>
      </div>

      <label
        htmlFor="mv-carried-out"
        className="flex items-center gap-2 text-sm text-[var(--foreground)]"
      >
        <Checkbox id="mv-carried-out" {...register('carriedOut')} />
        Visite effectuée
      </label>

      <FileDropzone
        id="mv-convocation-file"
        label={isEditing ? 'Remplacer la convocation (optionnel)' : 'Convocation (obligatoire) *'}
        file={convocationFile}
        onFileChange={(next) => {
          setConvocationFile(next);
          setConvocationError(undefined);
        }}
        allowedExtensions={ALLOWED_DOCUMENT_EXTENSIONS}
        maxBytes={MAX_FILE_SIZE_BYTES}
        error={convocationError}
      />

      <FileDropzone
        id="mv-report-file"
        label="Rapport / Attestation (optionnel)"
        file={reportFile}
        onFileChange={setReportFile}
        allowedExtensions={ALLOWED_DOCUMENT_EXTENSIONS}
        maxBytes={MAX_FILE_SIZE_BYTES}
      />

      <FormField id="mv-comments" label="Commentaires" error={errors.comments?.message}>
        <Textarea id="mv-comments" rows={2} {...register('comments')} />
      </FormField>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Annuler
        </Button>
        <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
          {isEditing ? 'Enregistrer' : 'Planifier'}
        </Button>
      </DialogFooter>
    </form>
  );
}
