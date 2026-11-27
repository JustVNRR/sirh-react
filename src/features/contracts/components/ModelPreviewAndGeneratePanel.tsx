import { Eye, FilePlus2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useEmployeesQuery, usePositionsQuery } from '@/features/employees';
import { useContractTypesQuery } from '@/features/organization';
import type { BlobDownloadResult } from '@/shared/api/httpClient';
import { ApiError } from '@/shared/api/types';
import { usePermission } from '@/shared/auth/AuthContext';
import { PERMISSIONS } from '@/shared/auth/permissions';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FormField,
  Input,
  PdfPreviewModal,
  Select,
  Textarea,
} from '@/shared/ui';
import {
  useGenerateContractMutation,
  usePreviewContractModelMutation,
} from '../hooks/useContractModelsQueries';
import type { ContractModelDto } from '../types/contractTypes';

export interface ModelPreviewAndGeneratePanelProps {
  model: ContractModelDto;
}

export function ModelPreviewAndGeneratePanel({ model }: ModelPreviewAndGeneratePanelProps) {
  const { can } = usePermission();
  const canGenerate = can(PERMISSIONS.CONTRACTS_WRITE);

  const employeesQuery = useEmployeesQuery({ page: 1, pageSize: 100 });
  const contractTypesQuery = useContractTypesQuery({ page: 1, pageSize: 100 });

  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedPositionId, setSelectedPositionId] = useState('');
  const [selectedContractTypeId, setSelectedContractTypeId] = useState(model.contractTypeId ?? '');
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [commentary, setCommentary] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [generatedSuccess, setGeneratedSuccess] = useState(false);

  const [previewResult, setPreviewResult] = useState<BlobDownloadResult | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const positionsQuery = usePositionsQuery(selectedEmployeeId, Boolean(selectedEmployeeId));
  const previewMutation = usePreviewContractModelMutation();
  const generateMutation = useGenerateContractMutation();

  const employees = employeesQuery.data?.items ?? [];
  const positions = positionsQuery.data ?? [];
  const contractTypes = contractTypesQuery.data?.items ?? [];

  const handleEmployeeChange = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setSelectedPositionId('');
    setActionError(null);
    setGeneratedSuccess(false);
  };

  const buildCustomPayload = (): Record<string, string> | undefined => {
    if (model.customVariables.length === 0) {
      return undefined;
    }
    const entries: Record<string, string> = {};
    for (const key of model.customVariables) {
      const value = customValues[key];
      if (value !== undefined && value.trim() !== '') {
        entries[key] = value.trim();
      }
    }
    return Object.keys(entries).length > 0 ? entries : undefined;
  };

  const handlePreview = async () => {
    if (!selectedPositionId) {
      setActionError('Veuillez sélectionner un collaborateur et un poste.');
      return;
    }
    setActionError(null);
    try {
      const result = await previewMutation.mutateAsync({
        id: model.id,
        payload: {
          positionId: selectedPositionId,
          customVariables: buildCustomPayload(),
        },
      });
      setPreviewResult(result);
      setPreviewOpen(true);
    } catch (error) {
      setActionError(
        error instanceof ApiError ? error.detail : 'Impossible de générer la prévisualisation PDF.',
      );
    }
  };

  const handleGenerate = async () => {
    if (!selectedPositionId || !selectedContractTypeId) {
      setActionError('Sélectionnez un poste et un type de contrat avant de générer.');
      return;
    }
    setActionError(null);
    setGeneratedSuccess(false);
    try {
      await generateMutation.mutateAsync({
        contractModelId: model.id,
        positionId: selectedPositionId,
        contractTypeId: selectedContractTypeId,
        customVariables: buildCustomPayload(),
        commentary: commentary.trim() || null,
      });
      setGeneratedSuccess(true);
      toast.success('Contrat généré et enregistré avec succès.');
    } catch (error) {
      if (error instanceof ApiError && error.isConflict) {
        setActionError(
          'Ce poste possède déjà un contrat associé (conflit 409). Consultez la liste des contrats.',
        );
        return;
      }
      setActionError(
        error instanceof ApiError ? error.detail : 'Impossible de générer le contrat.',
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prévisualisation QuestPDF &amp; Génération</CardTitle>
        <CardDescription>
          Testez le rendu PDF sur un poste réel ou générez directement le contrat définitif.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {actionError && (
          <Alert variant="danger" title="Action impossible">
            {actionError}
          </Alert>
        )}

        {generatedSuccess && (
          <Alert variant="success" title="Contrat généré">
            Le contrat PDF a été créé et rattaché au poste.{' '}
            <Link to="/contracts" className="font-semibold underline">
              Voir les contrats
            </Link>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <FormField id="preview-employee" label="Collaborateur">
            <Select
              id="preview-employee"
              value={selectedEmployeeId}
              onChange={(e) => handleEmployeeChange(e.target.value)}
            >
              <option value="">Sélectionner un collaborateur...</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField id="preview-position" label="Poste cible">
            <Select
              id="preview-position"
              value={selectedPositionId}
              disabled={!selectedEmployeeId || positionsQuery.isLoading}
              onChange={(e) => {
                setSelectedPositionId(e.target.value);
                setActionError(null);
              }}
            >
              <option value="">Sélectionner un poste...</option>
              {positions.map((pos) => (
                <option key={pos.id} value={pos.id}>
                  {pos.jobTitle} ({pos.startAt})
                </option>
              ))}
            </Select>
          </FormField>

          {canGenerate && (
            <FormField id="preview-contract-type" label="Type de contrat">
              <Select
                id="preview-contract-type"
                value={selectedContractTypeId}
                onChange={(e) => setSelectedContractTypeId(e.target.value)}
              >
                <option value="">Sélectionner un type...</option>
                {contractTypes.map((ct) => (
                  <option key={ct.id} value={ct.id}>
                    {ct.label} ({ct.code})
                  </option>
                ))}
              </Select>
            </FormField>
          )}
        </div>

        {model.customVariables.length > 0 && (
          <div className="space-y-3 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
              Valeurs des variables personnalisées
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {model.customVariables.map((varKey) => (
                <FormField key={varKey} id={`custom-var-${varKey}`} label={varKey}>
                  <Input
                    id={`custom-var-${varKey}`}
                    value={customValues[varKey] ?? ''}
                    placeholder={`Valeur pour ${varKey}`}
                    onChange={(e) =>
                      setCustomValues((prev) => ({ ...prev, [varKey]: e.target.value }))
                    }
                  />
                </FormField>
              ))}
            </div>
          </div>
        )}

        {canGenerate && (
          <FormField id="generate-commentary" label="Commentaire (pour génération)">
            <Textarea
              id="generate-commentary"
              rows={2}
              value={commentary}
              onChange={(e) => setCommentary(e.target.value)}
              placeholder="Note interne facultative..."
            />
          </FormField>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={!selectedPositionId}
            isLoading={previewMutation.isPending}
            onClick={() => void handlePreview()}
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
            Prévisualiser le PDF
          </Button>
          {canGenerate && (
            <Button
              type="button"
              disabled={!selectedPositionId || !selectedContractTypeId}
              isLoading={generateMutation.isPending}
              onClick={() => void handleGenerate()}
            >
              <FilePlus2 className="h-4 w-4" aria-hidden="true" />
              Générer le contrat
            </Button>
          )}
        </div>
      </CardContent>

      <PdfPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        blob={previewResult?.blob ?? null}
        fileName={previewResult?.fileName ?? `${model.title}.pdf`}
        title={`Aperçu — ${model.title}`}
      />
    </Card>
  );
}
