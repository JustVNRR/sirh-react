import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Plus, Save, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useContractTypesQuery } from '@/features/organization';
import { ApiError } from '@/shared/api/types';
import { usePermission } from '@/shared/auth/AuthContext';
import { PERMISSIONS } from '@/shared/auth/permissions';
import {
  Alert,
  Badge,
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
  Select,
  Spinner,
  Textarea,
} from '@/shared/ui';
import { ModelPreviewAndGeneratePanel } from '../components/ModelPreviewAndGeneratePanel';
import { VariablePalette } from '../components/VariablePalette';
import {
  useContractModelQuery,
  useCreateContractModelMutation,
  useUpdateContractModelMutation,
} from '../hooks/useContractModelsQueries';
import { contractModelSchema, type ContractModelFormValues } from '../schemas/contractSchemas';

function insertVariableAtCursor(
  textarea: HTMLTextAreaElement | null,
  currentValue: string,
  variableKey: string,
): string {
  const token = `{{ ${variableKey} }}`;
  if (!textarea) {
    return `${currentValue}${currentValue ? '\n' : ''}${token}`;
  }
  const start = textarea.selectionStart ?? currentValue.length;
  const end = textarea.selectionEnd ?? currentValue.length;
  return `${currentValue.slice(0, start)}${token}${currentValue.slice(end)}`;
}

function CustomVariablesField({
  customVariables,
  canWrite,
  onAdd,
  onRemove,
}: {
  customVariables: string[];
  canWrite: boolean;
  onAdd: (name: string) => void;
  onRemove: (name: string) => void;
}) {
  const [newCustomVar, setNewCustomVar] = useState('');

  const handleAdd = () => {
    const cleaned = newCustomVar.trim();
    if (!cleaned) {
      return;
    }
    onAdd(cleaned);
    setNewCustomVar('');
  };

  return (
    <div className="space-y-2">
      <FormField id="model-custom-var-input" label="Variables personnalisées (optionnel)">
        <div className="flex gap-2">
          <Input
            id="model-custom-var-input"
            disabled={!canWrite}
            value={newCustomVar}
            placeholder="ex: trial_period_months"
            onChange={(e) => setNewCustomVar(e.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            disabled={!canWrite || !newCustomVar.trim()}
            onClick={handleAdd}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Ajouter
          </Button>
        </div>
      </FormField>
      {customVariables.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {customVariables.map((v) => (
            <Badge key={v} variant="primary" className="gap-1">
              {v}
              {canWrite && (
                <button
                  type="button"
                  aria-label={`Retirer la variable ${v}`}
                  onClick={() => onRemove(v)}
                  className="ml-1 cursor-pointer"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export function ContractModelStudioPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const { can } = usePermission();
  const canWrite = can(PERMISSIONS.CONTRACT_MODELS_WRITE);

  const modelQuery = useContractModelQuery(id);
  const contractTypesQuery = useContractTypesQuery({ page: 1, pageSize: 100 });
  const createMutation = useCreateContractModelMutation();
  const updateMutation = useUpdateContractModelMutation();

  const [customVariables, setCustomVariables] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [conflictDetected, setConflictDetected] = useState(false);

  const templateTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<ContractModelFormValues>({
    resolver: zodResolver(contractModelSchema),
    defaultValues: {
      title: '',
      description: '',
      contractTypeId: '',
      templateContent: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (modelQuery.data) {
      reset({
        title: modelQuery.data.title,
        description: modelQuery.data.description ?? '',
        contractTypeId: modelQuery.data.contractTypeId ?? '',
        templateContent: modelQuery.data.templateContent,
        isActive: modelQuery.data.isActive,
      });
      setCustomVariables(modelQuery.data.customVariables);
      setConflictDetected(false);
    }
  }, [modelQuery.data, reset]);

  const templateField = register('templateContent');

  const handleInsertVariable = (key: string) => {
    const current = getValues('templateContent');
    const nextValue = insertVariableAtCursor(templateTextareaRef.current, current, key);
    setValue('templateContent', nextValue, { shouldDirty: true, shouldValidate: true });
  };

  const handleAddCustomVariable = (cleaned: string) => {
    if (customVariables.includes(cleaned)) {
      return;
    }
    setCustomVariables((prev) => [...prev, cleaned]);
  };

  const handleRemoveCustomVariable = (name: string) => {
    setCustomVariables((prev) => prev.filter((item) => item !== name));
  };

  const onSubmit = async (values: ContractModelFormValues) => {
    setSubmitError(null);
    setConflictDetected(false);

    const payload = {
      title: values.title.trim(),
      description: values.description?.trim() || null,
      contractTypeId: values.contractTypeId || null,
      templateContent: values.templateContent,
      customVariables,
      isActive: values.isActive,
    };

    try {
      if (isEditing && id && modelQuery.data) {
        await updateMutation.mutateAsync({
          id,
          payload: { ...payload, rowVersion: modelQuery.data.rowVersion },
        });
        toast.success('Modèle de contrat mis à jour.');
      } else {
        const created = await createMutation.mutateAsync(payload);
        toast.success('Modèle de contrat créé.');
        navigate(`/contracts/models/${created.id}`, { replace: true });
      }
    } catch (error) {
      if (error instanceof ApiError && error.isConflict) {
        setConflictDetected(true);
        return;
      }
      setSubmitError(
        error instanceof ApiError ? error.detail : 'Impossible d’enregistrer le modèle.',
      );
    }
  };

  if (isEditing && modelQuery.isLoading) {
    return <Spinner label="Chargement du modèle de contrat..." />;
  }

  if (isEditing && modelQuery.error) {
    return (
      <Alert variant="danger" title="Modèle introuvable">
        {modelQuery.error instanceof ApiError
          ? modelQuery.error.detail
          : 'Impossible de charger ce modèle.'}
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditing ? `Studio — ${modelQuery.data?.title ?? ''}` : 'Nouveau modèle de contrat'}
        description="Rédigez le contenu Markdown/Scriban puis testez le rendu PDF sur un poste."
        actions={
          <Button variant="outline" asChild>
            <Link to="/contracts/models">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Modèles
            </Link>
          </Button>
        }
      />

      {conflictDetected && (
        <ConcurrencyConflictBanner
          onReload={() => {
            setConflictDetected(false);
            modelQuery.refetch().catch(() => undefined);
          }}
        />
      )}

      {submitError && (
        <Alert variant="danger" title="Erreur de validation ou de syntaxe Scriban">
          {submitError}
        </Alert>
      )}

      <form
        onSubmit={(e) => {
          handleSubmit(onSubmit)(e).catch(() => undefined);
        }}
        className="grid gap-6 lg:grid-cols-3"
      >
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Métadonnées &amp; Contenu Scriban</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField id="model-title" label="Titre du modèle" error={errors.title?.message}>
                  <Input id="model-title" disabled={!canWrite} {...register('title')} />
                </FormField>

                <FormField id="model-contract-type" label="Type de contrat associé">
                  <Select
                    id="model-contract-type"
                    disabled={!canWrite}
                    {...register('contractTypeId')}
                  >
                    <option value="">Générique (tous types)</option>
                    {(contractTypesQuery.data?.items ?? []).map((ct) => (
                      <option key={ct.id} value={ct.id}>
                        {ct.label} ({ct.code})
                      </option>
                    ))}
                  </Select>
                </FormField>
              </div>

              <FormField
                id="model-description"
                label="Description"
                error={errors.description?.message}
              >
                <Input id="model-description" disabled={!canWrite} {...register('description')} />
              </FormField>

              <CustomVariablesField
                customVariables={customVariables}
                canWrite={canWrite}
                onAdd={handleAddCustomVariable}
                onRemove={handleRemoveCustomVariable}
              />

              <FormField
                id="model-template-content"
                label="Contenu Markdown / Scriban"
                error={errors.templateContent?.message}
              >
                <Textarea
                  id="model-template-content"
                  rows={16}
                  className="font-mono text-xs"
                  disabled={!canWrite}
                  hasError={Boolean(errors.templateContent)}
                  name={templateField.name}
                  onBlur={templateField.onBlur}
                  onChange={templateField.onChange}
                  ref={(el) => {
                    templateField.ref(el);
                    templateTextareaRef.current = el;
                  }}
                />
              </FormField>

              <div className="flex items-center justify-between pt-2">
                <label
                  htmlFor="model-is-active"
                  className="flex items-center gap-2 text-sm text-[var(--foreground)]"
                >
                  <Checkbox id="model-is-active" disabled={!canWrite} {...register('isActive')} />
                  Modèle actif (utilisable pour la génération)
                </label>

                {canWrite && (
                  <Button
                    type="submit"
                    isLoading={createMutation.isPending || updateMutation.isPending}
                  >
                    <Save className="h-4 w-4" aria-hidden="true" />
                    {isEditing ? 'Enregistrer les modifications' : 'Créer le modèle'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <VariablePalette
            customVariables={customVariables}
            disabled={!canWrite}
            onInsert={handleInsertVariable}
          />
        </div>
      </form>

      {isEditing && modelQuery.data && <ModelPreviewAndGeneratePanel model={modelQuery.data} />}
    </div>
  );
}
