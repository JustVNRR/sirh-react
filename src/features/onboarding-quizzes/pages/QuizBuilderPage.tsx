import { ArrowLeft, Globe, Plus, Save } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useCompaniesQuery } from '@/features/organization';
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
  ConcurrencyConflictBanner,
  FormField,
  Input,
  PageHeader,
  Select,
  Spinner,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from '@/shared/ui';
import { QuizQuestionEditor } from '../components/QuizQuestionEditor';
import { QuizResultsTab } from '../components/QuizResultsTab';
import {
  useCreateQuizMutation,
  usePublishQuizMutation,
  useQuizDetailQuery,
  useUpdateQuizMutation,
} from '../hooks/useQuizzesQueries';
import type { OnboardingQuizDetailDto, QuizQuestionInput } from '../types/quizTypes';

function createEmptyQuestion(): QuizQuestionInput {
  return {
    questionText: '',
    questionType: 'singleChoice',
    explanation: '',
    choices: [
      { choiceText: '', isCorrect: true },
      { choiceText: '', isCorrect: false },
    ],
  };
}

export function QuizBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const { can } = usePermission();
  const canWrite = can(PERMISSIONS.QUIZZES_WRITE);

  const quizQuery = useQuizDetailQuery(id);

  if (isEditing && quizQuery.isLoading) {
    return <Spinner label="Chargement du QCM..." />;
  }

  if (isEditing && quizQuery.error) {
    return (
      <Alert variant="danger" title="QCM introuvable">
        {quizQuery.error instanceof ApiError
          ? quizQuery.error.detail
          : 'Impossible de charger ce QCM.'}
      </Alert>
    );
  }

  if (isEditing && !quizQuery.data) {
    return <Spinner label="Chargement du QCM..." />;
  }

  const quiz = quizQuery.data ?? null;

  const editorForm = (
    <QuizBuilderForm
      key={quiz ? `${quiz.id}-${quiz.rowVersion}` : 'new'}
      id={id}
      quiz={quiz}
      canWrite={canWrite}
      onRefetch={() => {
        quizQuery.refetch().catch(() => undefined);
      }}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditing ? `QCM — ${quiz?.title ?? ''}` : 'Nouveau QCM d’intégration'}
        description="Définissez les questions, les bonnes réponses et suivez les tentatives."
        actions={
          <Button variant="outline" asChild>
            <Link to="/onboarding-quizzes">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Retour aux QCM
            </Link>
          </Button>
        }
      />

      {isEditing && id ? (
        <Tabs defaultValue={canWrite ? 'edit' : 'results'}>
          <TabsList>
            <TabsTrigger value="edit">Édition</TabsTrigger>
            <TabsTrigger value="results">Résultats</TabsTrigger>
          </TabsList>
          <TabsContent value="edit">{editorForm}</TabsContent>
          <TabsContent value="results">
            <QuizResultsTab quizId={id} />
          </TabsContent>
        </Tabs>
      ) : (
        editorForm
      )}
    </div>
  );
}

function QuizBuilderForm({
  id,
  quiz,
  canWrite,
  onRefetch,
}: {
  id: string | undefined;
  quiz: OnboardingQuizDetailDto | null;
  canWrite: boolean;
  onRefetch: () => void;
}) {
  const navigate = useNavigate();
  const isEditing = Boolean(id && quiz);

  const companiesQuery = useCompaniesQuery({ page: 1, pageSize: 100 });
  const createMutation = useCreateQuizMutation();
  const updateMutation = useUpdateQuizMutation();
  const publishMutation = usePublishQuizMutation();

  const [title, setTitle] = useState(() => quiz?.title ?? '');
  const [description, setDescription] = useState(() => quiz?.description ?? '');
  const [companyId, setCompanyId] = useState(() => quiz?.companyId ?? '');
  const [passingScorePercent, setPassingScorePercent] = useState(
    () => quiz?.passingScorePercent ?? 80,
  );
  const [questions, setQuestions] = useState<QuizQuestionInput[]>(() =>
    quiz
      ? quiz.questions.map((item) => ({
          questionText: item.questionText,
          questionType: item.questionType,
          explanation: item.explanation ?? '',
          orderIndex: item.orderIndex,
          choices: item.choices.map((c) => ({
            choiceText: c.choiceText,
            isCorrect: Boolean(c.isCorrect),
            orderIndex: c.orderIndex,
          })),
        }))
      : [createEmptyQuestion()],
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [conflictDetected, setConflictDetected] = useState(false);

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitError(null);
    setConflictDetected(false);

    const payload = {
      companyId: companyId || null,
      title: title.trim(),
      description: description.trim() || null,
      passingScorePercent,
      questions: questions.map((q, qIdx) => ({
        questionText: q.questionText.trim(),
        questionType: q.questionType,
        explanation: q.explanation?.trim() || null,
        orderIndex: qIdx + 1,
        choices: q.choices.map((c, cIdx) => ({
          choiceText: c.choiceText.trim(),
          isCorrect: c.isCorrect,
          orderIndex: cIdx + 1,
        })),
      })),
    };

    try {
      if (isEditing && id && quiz) {
        await updateMutation.mutateAsync({
          id,
          payload: { ...payload, rowVersion: quiz.rowVersion },
        });
        toast.success('QCM enregistré.');
      } else {
        const created = await createMutation.mutateAsync(payload);
        toast.success('QCM créé.');
        navigate(`/onboarding-quizzes/${created.id}/edit`, { replace: true });
      }
    } catch (error) {
      if (error instanceof ApiError && error.isConflict) {
        setConflictDetected(true);
        return;
      }
      setSubmitError(error instanceof ApiError ? error.detail : 'Impossible d’enregistrer le QCM.');
    }
  };

  const handleTogglePublish = async () => {
    if (!id || !quiz) {
      return;
    }
    setSubmitError(null);
    try {
      const nextPublished = !quiz.isPublished;
      await publishMutation.mutateAsync({
        id,
        payload: { isPublished: nextPublished, rowVersion: quiz.rowVersion },
      });
      toast.success(nextPublished ? 'QCM publié !' : 'QCM repassé en brouillon.');
    } catch (error) {
      if (error instanceof ApiError && error.isConflict) {
        setConflictDetected(true);
        return;
      }
      setSubmitError(
        error instanceof ApiError ? error.detail : 'Impossible de modifier la publication.',
      );
    }
  };

  const isPublished = quiz?.isPublished ?? false;

  const handleUpdateQuestion = (targetIdx: number, next: QuizQuestionInput) => {
    setQuestions((prev) => prev.map((q, qIdx) => (qIdx === targetIdx ? next : q)));
  };

  const handleRemoveQuestion = (targetIdx: number) => {
    setQuestions((prev) => prev.filter((_, qIdx) => qIdx !== targetIdx));
  };

  return (
    <form
      onSubmit={(e) => {
        handleSave(e).catch(() => undefined);
      }}
      className="space-y-6"
    >
      {conflictDetected && (
        <ConcurrencyConflictBanner
          onReload={() => {
            setConflictDetected(false);
            onRefetch();
          }}
        />
      )}

      {submitError && (
        <Alert variant="danger" title="Validation impossible">
          {submitError}
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Paramètres du QCM</CardTitle>
          {isEditing && (
            <Badge variant={isPublished ? 'success' : 'neutral'}>
              {isPublished ? 'Publié' : 'Brouillon'}
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <FormField id="quiz-title" label="Titre du QCM *">
                <Input
                  id="quiz-title"
                  required
                  disabled={!canWrite}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </FormField>
            </div>
            <FormField id="quiz-threshold" label="Seuil de réussite (%)">
              <Input
                id="quiz-threshold"
                type="number"
                min={1}
                max={100}
                disabled={!canWrite}
                value={passingScorePercent}
                onChange={(e) => setPassingScorePercent(Number(e.target.value) || 80)}
              />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="quiz-company" label="Entreprise (optionnel)">
              <Select
                id="quiz-company"
                disabled={!canWrite}
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
            </FormField>

            <FormField id="quiz-description" label="Description">
              <Textarea
                id="quiz-description"
                rows={2}
                disabled={!canWrite}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Questions ({questions.length})
          </h2>
          {canWrite && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setQuestions((prev) => [...prev, createEmptyQuestion()])}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Ajouter une question
            </Button>
          )}
        </div>

        {questions.map((question, idx) => (
          <QuizQuestionEditor
            key={idx}
            index={idx}
            question={question}
            disabled={!canWrite}
            onChange={(next) => handleUpdateQuestion(idx, next)}
            onRemove={() => handleRemoveQuestion(idx)}
          />
        ))}
      </div>

      {canWrite && (
        <div className="flex flex-wrap justify-end gap-2">
          {isEditing && (
            <Button
              type="button"
              variant="outline"
              isLoading={publishMutation.isPending}
              onClick={() => {
                handleTogglePublish().catch(() => undefined);
              }}
            >
              <Globe className="h-4 w-4" aria-hidden="true" />
              {isPublished ? 'Dépublier' : 'Publier'}
            </Button>
          )}
          <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
            <Save className="h-4 w-4" aria-hidden="true" />
            {isEditing ? 'Enregistrer' : 'Créer le QCM'}
          </Button>
        </div>
      )}
    </form>
  );
}
