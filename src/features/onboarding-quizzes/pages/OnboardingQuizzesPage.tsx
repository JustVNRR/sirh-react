import { GraduationCap, Pencil, Play, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useCompaniesQuery } from '@/features/organization';
import { ApiError } from '@/shared/api/types';
import { usePermission } from '@/shared/auth/AuthContext';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { useDebounce } from '@/shared/hooks/useDebounce';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  EmptyState,
  Input,
  PageHeader,
  Select,
  Spinner,
} from '@/shared/ui';
import { useDeleteQuizMutation, useQuizzesQuery } from '../hooks/useQuizzesQueries';
import type { OnboardingQuizSummaryDto } from '../types/quizTypes';

export function OnboardingQuizzesPage() {
  const { can } = usePermission();
  const canWrite = can(PERMISSIONS.QUIZZES_WRITE);
  const canTake = can(PERMISSIONS.QUIZZES_TAKE);
  const canSeeResults = can(PERMISSIONS.QUIZZES_RESULTS_ALL);

  const [search, setSearch] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [publishedFilter, setPublishedFilter] = useState<'all' | 'true' | 'false'>('all');
  const [deleteTarget, setDeleteTarget] = useState<OnboardingQuizSummaryDto | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const companiesQuery = useCompaniesQuery({ page: 1, pageSize: 100 });
  const publishedParam = publishedFilter === 'all' ? undefined : publishedFilter === 'true';

  const quizzesQuery = useQuizzesQuery({
    search: debouncedSearch || undefined,
    companyId: companyId || undefined,
    published: publishedParam,
    page: 1,
    pageSize: 50,
  });
  const deleteMutation = useDeleteQuizMutation();

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    setActionError(null);
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success('QCM supprimé.');
      setDeleteTarget(null);
    } catch (error) {
      setActionError(error instanceof ApiError ? error.detail : 'Impossible de supprimer le QCM.');
      setDeleteTarget(null);
    }
  };

  const items = quizzesQuery.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="QCM d’intégration"
        description="Questionnaires d’onboarding, suivi des résultats et validation des connaissances."
        actions={
          canWrite && (
            <Button asChild>
              <Link to="/onboarding-quizzes/new">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Nouveau QCM
              </Link>
            </Button>
          )
        }
      />

      <div className="grid gap-3 md:grid-cols-3">
        <Input
          aria-label="Rechercher un QCM"
          placeholder="Rechercher par titre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          aria-label="Filtrer par entreprise"
          value={companyId}
          onChange={(e) => setCompanyId(e.target.value)}
        >
          <option value="">Toutes les entreprises</option>
          {(companiesQuery.data?.items ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        {canWrite && (
          <Select
            aria-label="Filtrer par publication"
            value={publishedFilter}
            onChange={(e) => setPublishedFilter(e.target.value as 'all' | 'true' | 'false')}
          >
            <option value="all">Tous (publiés + brouillons)</option>
            <option value="true">Publiés uniquement</option>
            <option value="false">Brouillons uniquement</option>
          </Select>
        )}
      </div>

      {actionError && (
        <Alert variant="danger" title="Erreur">
          {actionError}
        </Alert>
      )}

      {quizzesQuery.isLoading && <Spinner label="Chargement des QCM..." />}

      {quizzesQuery.error && (
        <Alert variant="danger" title="Erreur">
          {quizzesQuery.error instanceof ApiError
            ? quizzesQuery.error.detail
            : 'Impossible de charger les QCM.'}
        </Alert>
      )}

      {!quizzesQuery.isLoading && !quizzesQuery.error && items.length === 0 && (
        <EmptyState
          icon={<GraduationCap className="h-6 w-6" aria-hidden="true" />}
          title="Aucun QCM disponible"
          description="Aucun questionnaire ne correspond aux critères actuels."
        />
      )}

      {items.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((quiz) => (
            <Card key={quiz.id} className="flex flex-col justify-between">
              <CardHeader className="space-y-2 pb-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant={quiz.isPublished ? 'success' : 'neutral'}>
                    {quiz.isPublished ? 'Publié' : 'Brouillon'}
                  </Badge>
                  <Badge variant="info">
                    {quiz.questionCount} question{quiz.questionCount > 1 ? 's' : ''}
                  </Badge>
                  <Badge variant="neutral">Seuil : {quiz.passingScorePercent} %</Badge>
                  {quiz.myHasPassed !== null && (
                    <Badge variant={quiz.myHasPassed ? 'success' : 'warning'}>
                      {quiz.myHasPassed ? 'Validé' : 'À repasser'}
                      {quiz.myBestScorePercent !== null ? ` (${quiz.myBestScorePercent} %)` : ''}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-base">{quiz.title}</CardTitle>
                {quiz.description && <CardDescription>{quiz.description}</CardDescription>}
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] pt-3">
                {quiz.isPublished && canTake ? (
                  <Button size="sm" asChild>
                    <Link to={`/onboarding-quizzes/${quiz.id}/take`}>
                      <Play className="h-3.5 w-3.5" aria-hidden="true" />
                      Passer le QCM
                    </Link>
                  </Button>
                ) : (
                  <span />
                )}

                <div className="flex items-center gap-1">
                  {(canWrite || canSeeResults) && (
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/onboarding-quizzes/${quiz.id}/edit`}>
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        {canWrite ? 'Éditer / Résultats' : 'Résultats'}
                      </Link>
                    </Button>
                  )}
                  {canWrite && (
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Supprimer le QCM ${quiz.title}`}
                      onClick={() => setDeleteTarget(quiz)}
                    >
                      <Trash2 className="h-4 w-4 text-[var(--danger)]" aria-hidden="true" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title={`Supprimer « ${deleteTarget?.title ?? ''} » ?`}
        description="Ce questionnaire et son historique de tentatives seront supprimés."
        confirmLabel="Supprimer"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => void handleConfirmDelete()}
      />
    </div>
  );
}
