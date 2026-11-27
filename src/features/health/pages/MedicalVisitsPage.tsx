import type { ColumnDef } from '@tanstack/react-table';
import { Download, Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useEmployeesQuery } from '@/features/employees';
import type { BlobDownloadResult } from '@/shared/api/httpClient';
import { ApiError } from '@/shared/api/types';
import { usePermission } from '@/shared/auth/AuthContext';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { triggerBlobDownload } from '@/shared/lib/file';
import { formatDateFr, formatDateTimeFr } from '@/shared/lib/format';
import {
  Alert,
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  Input,
  PageHeader,
  PdfPreviewModal,
  Select,
} from '@/shared/ui';
import { medicalVisitsApi } from '../api/medicalVisitsApi';
import { MedicalVisitFormDialog } from '../components/MedicalVisitFormDialog';
import {
  useDeleteMedicalVisitMutation,
  useMedicalVisitsQuery,
} from '../hooks/useMedicalVisitsQueries';
import { MEDICAL_VISIT_TYPES, MEDICAL_VISIT_TYPE_LABELS } from '../schemas/medicalVisitSchemas';
import type { MedicalVisitDto, MedicalVisitType } from '../types/medicalVisitTypes';

export function MedicalVisitsPage() {
  const { can } = usePermission();
  const canReadAll = can(PERMISSIONS.MEDICAL_VISITS_READ_ALL);
  const canWrite = can(PERMISSIONS.MEDICAL_VISITS_WRITE);

  const [employeeId, setEmployeeId] = useState('');
  const [visitType, setVisitType] = useState<MedicalVisitType | ''>('');
  const [carriedOutFilter, setCarriedOutFilter] = useState<'all' | 'true' | 'false'>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MedicalVisitDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MedicalVisitDto | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [previewResult, setPreviewResult] = useState<BlobDownloadResult | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const employeesQuery = useEmployeesQuery({ page: 1, pageSize: 100 }, canReadAll);
  const carriedOutParam = carriedOutFilter === 'all' ? undefined : carriedOutFilter === 'true';

  const visitsQuery = useMedicalVisitsQuery({
    employeeId: employeeId || undefined,
    visitType: visitType || undefined,
    carriedOut: carriedOutParam,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    page,
    pageSize: 20,
  });
  const deleteMutation = useDeleteMedicalVisitMutation();

  const employeeMap = new Map(
    (employeesQuery.data?.items ?? []).map((e) => [e.id, `${e.firstName} ${e.lastName}`]),
  );

  const handleOpenFile = async (
    visit: MedicalVisitDto,
    kind: 'convocation' | 'report',
    download: boolean,
  ) => {
    setActionError(null);
    try {
      const res =
        kind === 'convocation'
          ? await medicalVisitsApi.downloadConvocationFile(visit.id, download)
          : await medicalVisitsApi.downloadReportFile(visit.id, download);

      if (download) {
        triggerBlobDownload(res.blob, res.fileName);
      } else {
        setPreviewResult(res);
        setPreviewOpen(true);
      }
    } catch (error) {
      setActionError(error instanceof ApiError ? error.detail : 'Impossible d’ouvrir le fichier.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    setActionError(null);
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success('Visite médicale supprimée.');
      setDeleteTarget(null);
    } catch (error) {
      setActionError(
        error instanceof ApiError ? error.detail : 'Impossible de supprimer cette visite.',
      );
      setDeleteTarget(null);
    }
  };

  const columns: ColumnDef<MedicalVisitDto>[] = [
    ...(canReadAll
      ? [
          {
            id: 'employee',
            header: 'Collaborateur',
            cell: ({ row }: { row: { original: MedicalVisitDto } }) =>
              employeeMap.get(row.original.employeeId) ?? row.original.employeeId,
          },
        ]
      : []),
    {
      id: 'type',
      header: 'Visite',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-[var(--foreground)]">
            {MEDICAL_VISIT_TYPE_LABELS[row.original.visitType]}
          </p>
          {row.original.medicalCenter && (
            <p className="text-xs text-[var(--muted-foreground)]">{row.original.medicalCenter}</p>
          )}
        </div>
      ),
    },
    {
      id: 'date',
      header: 'Date & Validité',
      cell: ({ row }) => (
        <div>
          <p>{formatDateTimeFr(row.original.visitDateTimeUtc)}</p>
          {row.original.validityDate && (
            <p className="text-xs text-[var(--muted-foreground)]">
              Valide jusqu’au {formatDateFr(row.original.validityDate)}
            </p>
          )}
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Statut',
      cell: ({ row }) => (
        <Badge variant={row.original.carriedOut ? 'success' : 'warning'}>
          {row.original.carriedOut ? 'Réalisée' : 'Planifiée'}
        </Badge>
      ),
    },
    {
      id: 'files',
      header: 'Documents',
      cell: ({ row }) => {
        const visit = row.original;
        return (
          <div className="flex flex-wrap items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                handleOpenFile(visit, 'convocation', false).catch(() => undefined);
              }}
            >
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              Convocation
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Télécharger la convocation ${visit.convocationFileName}`}
              onClick={() => {
                handleOpenFile(visit, 'convocation', true).catch(() => undefined);
              }}
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
            {visit.hasReport && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleOpenFile(visit, 'report', false).catch(() => undefined);
                  }}
                >
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                  Rapport
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Télécharger le rapport ${visit.reportFileName ?? ''}`}
                  onClick={() => {
                    handleOpenFile(visit, 'report', true).catch(() => undefined);
                  }}
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </>
            )}
          </div>
        );
      },
    },
    ...(canWrite
      ? [
          {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }: { row: { original: MedicalVisitDto } }) => {
              const visit = row.original;
              return (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Modifier la visite médicale"
                    onClick={() => {
                      setEditTarget(visit);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Supprimer la visite médicale"
                    onClick={() => setDeleteTarget(visit)}
                  >
                    <Trash2 className="h-4 w-4 text-[var(--danger)]" aria-hidden="true" />
                  </Button>
                </div>
              );
            },
          },
        ]
      : []),
  ];

  const items = visitsQuery.data?.items ?? [];
  const totalCount = visitsQuery.data?.totalCount ?? 0;
  const totalPages = visitsQuery.data?.totalPages ?? 1;
  let errorMessage: string | undefined;
  if (visitsQuery.error) {
    errorMessage =
      visitsQuery.error instanceof ApiError
        ? visitsQuery.error.detail
        : 'Impossible de charger les visites médicales.';
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={canReadAll ? 'Visites médicales' : 'Mes visites médicales'}
        description="Suivi des convocations, rendez-vous de médecine du travail et rapports d’aptitude."
        actions={
          canWrite && (
            <Button
              onClick={() => {
                setEditTarget(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Planifier une visite
            </Button>
          )
        }
      />

      <div className="grid gap-3 md:grid-cols-5">
        {canReadAll && (
          <Select
            aria-label="Filtrer par collaborateur"
            value={employeeId}
            onChange={(e) => {
              setEmployeeId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tous les collaborateurs</option>
            {(employeesQuery.data?.items ?? []).map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName}
              </option>
            ))}
          </Select>
        )}

        <Select
          aria-label="Filtrer par type de visite"
          value={visitType}
          onChange={(e) => {
            setVisitType(e.target.value as MedicalVisitType | '');
            setPage(1);
          }}
        >
          <option value="">Tous les types</option>
          {MEDICAL_VISIT_TYPES.map((t) => (
            <option key={t} value={t}>
              {MEDICAL_VISIT_TYPE_LABELS[t]}
            </option>
          ))}
        </Select>

        <Select
          aria-label="Filtrer par réalisation"
          value={carriedOutFilter}
          onChange={(e) => {
            setCarriedOutFilter(e.target.value as 'all' | 'true' | 'false');
            setPage(1);
          }}
        >
          <option value="all">Tous les statuts</option>
          <option value="false">Planifiées (à venir)</option>
          <option value="true">Réalisées</option>
        </Select>

        <Input
          aria-label="Date de début"
          type="date"
          value={fromDate}
          onChange={(e) => {
            setFromDate(e.target.value);
            setPage(1);
          }}
        />

        <Input
          aria-label="Date de fin"
          type="date"
          value={toDate}
          onChange={(e) => {
            setToDate(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {actionError && (
        <Alert variant="danger" title="Erreur">
          {actionError}
        </Alert>
      )}

      <DataTable
        columns={columns}
        data={items}
        page={page}
        pageSize={20}
        totalCount={totalCount}
        totalPages={totalPages}
        onPageChange={setPage}
        isLoading={visitsQuery.isLoading}
        errorMessage={errorMessage}
        emptyTitle="Aucune visite médicale"
        emptyDescription="Aucune convocation ou visite enregistrée sur ces critères."
      />

      <MedicalVisitFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        visit={editTarget}
        onRefreshRequested={() => {
          visitsQuery.refetch().catch(() => undefined);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title="Supprimer cette visite médicale ?"
        description="La visite ainsi que la convocation et le rapport associés seront supprimés."
        confirmLabel="Supprimer"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => void handleConfirmDelete()}
      />

      <PdfPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        blob={previewResult?.blob ?? null}
        fileName={previewResult?.fileName ?? 'document.pdf'}
        title={previewResult?.fileName ?? 'Document médical'}
      />
    </div>
  );
}
