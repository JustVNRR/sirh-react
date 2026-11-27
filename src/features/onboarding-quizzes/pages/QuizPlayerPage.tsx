import { ArrowLeft, CheckCircle2, RotateCcw, Send, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError } from '@/shared/api/types';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  PageHeader,
  Spinner,
} from '@/shared/ui';
import {
  useStartQuizAttemptMutation,
  useSubmitQuizAttemptMutation,
} from '../hooks/useQuizzesQueries';
import type {
  QuizAttemptQuestionDto,
  QuizAttemptResultDto,
  StartedQuizAttemptDto,
} from '../types/quizTypes';

function QuizCorrectionView({
  attempt,
  result,
  onRetry,
}: {
  attempt: StartedQuizAttemptDto;
  result: QuizAttemptResultDto;
  onRetry: () => void;
}) {
  const questionMap = new Map(attempt.questions.map((q) => [q.id, q]));

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant={result.passed ? 'success' : 'danger'}>
                {result.passed ? 'Réussi' : 'Échoué'}
              </Badge>
              <span className="text-sm text-[var(--muted-foreground)]">
                Seuil requis : {attempt.passingScorePercent} %
              </span>
            </div>
            <p className="text-3xl font-bold tabular-nums text-[var(--foreground)]">
              {result.scorePercent} %
            </p>
            <p className="text-sm text-[var(--muted-foreground)]">
              {result.correctAnswersCount} bonne{result.correctAnswersCount > 1 ? 's' : ''} réponse
              {result.correctAnswersCount > 1 ? 's' : ''} sur {result.totalQuestionsCount}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={onRetry}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Repasser le QCM
            </Button>
            <Button asChild>
              <Link to="/onboarding-quizzes">Retour aux QCM</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {result.corrections.map((corr, idx) => {
          const sourceQuestion = questionMap.get(corr.questionId);
          const choiceMap = new Map(
            (sourceQuestion?.choices ?? []).map((c) => [c.id, c.choiceText]),
          );
          const selectedText = corr.selectedChoiceIds
            .map((cid) => choiceMap.get(cid) ?? cid)
            .join(', ');
          const correctText = corr.correctChoiceIds
            .map((cid) => choiceMap.get(cid) ?? cid)
            .join(', ');

          return (
            <Card key={corr.questionId}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <CardTitle className="text-base">
                  {idx + 1}. {corr.questionText}
                </CardTitle>
                <Badge variant={corr.isCorrect ? 'success' : 'danger'} className="gap-1">
                  {corr.isCorrect ? (
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {corr.isCorrect ? 'Correct' : 'Incorrect'}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <span className="font-medium text-[var(--muted-foreground)]">
                    Votre réponse :{' '}
                  </span>
                  <span>{selectedText || 'Aucune réponse'}</span>
                </p>
                <p>
                  <span className="font-medium text-[var(--muted-foreground)]">
                    Bonne(s) réponse(s) :{' '}
                  </span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                    {correctText}
                  </span>
                </p>
                {corr.explanation && (
                  <p className="rounded-lg bg-[var(--surface-muted)] p-3 text-xs text-[var(--foreground)]">
                    <strong>Explication :</strong> {corr.explanation}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function QuizQuestionCard({
  index,
  question,
  selectedIds,
  onSelectSingle,
  onToggleMultiple,
}: {
  index: number;
  question: QuizAttemptQuestionDto;
  selectedIds: string[];
  onSelectSingle: (choiceId: string) => void;
  onToggleMultiple: (choiceId: string, checked: boolean) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {index + 1}. {question.questionText}
        </CardTitle>
        <CardDescription>
          {question.questionType === 'singleChoice'
            ? 'Une seule réponse attendue'
            : 'Plusieurs réponses possibles'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {question.choices.map((choice) => {
          const isChecked = selectedIds.includes(choice.id);
          if (question.questionType === 'singleChoice') {
            const radioId = `q-${question.id}-c-${choice.id}`;
            return (
              <label
                key={choice.id}
                htmlFor={radioId}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm hover:bg-[var(--surface-muted)]"
              >
                <input
                  id={radioId}
                  type="radio"
                  name={`question-${question.id}`}
                  checked={isChecked}
                  onChange={() => onSelectSingle(choice.id)}
                  className="h-4 w-4 accent-[var(--primary)]"
                />
                <span>{choice.choiceText}</span>
              </label>
            );
          }

          return (
            <div
              key={choice.id}
              className="rounded-lg border border-[var(--border)] px-3 py-2.5 hover:bg-[var(--surface-muted)]"
            >
              <Checkbox
                id={`q-${question.id}-c-${choice.id}`}
                label={choice.choiceText}
                checked={isChecked}
                onChange={(e) => onToggleMultiple(choice.id, e.target.checked)}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function QuizPlayerPage() {
  const { id } = useParams<{ id: string }>();
  const startMutation = useStartQuizAttemptMutation();
  const submitMutation = useSubmitQuizAttemptMutation();

  const [attempt, setAttempt] = useState<StartedQuizAttemptDto | null>(null);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<QuizAttemptResultDto | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const startedQuizRef = useRef<string | null>(null);

  const launchAttempt = async (quizId: string) => {
    setErrorMsg(null);
    setResult(null);
    setAnswers({});
    try {
      const started = await startMutation.mutateAsync(quizId);
      setAttempt(started);
    } catch (error) {
      setErrorMsg(
        error instanceof ApiError ? error.detail : 'Impossible de démarrer ce questionnaire.',
      );
    }
  };

  useEffect(() => {
    if (!id || startedQuizRef.current === id) {
      return;
    }
    startedQuizRef.current = id;
    launchAttempt(id).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSubmit = async () => {
    if (!attempt) {
      return;
    }
    setErrorMsg(null);
    try {
      const submitted = await submitMutation.mutateAsync({
        attemptId: attempt.attemptId,
        payload: {
          answers: attempt.questions.map((q) => ({
            questionId: q.id,
            selectedChoiceIds: answers[q.id] ?? [],
          })),
        },
      });
      setResult(submitted);
    } catch (error) {
      setErrorMsg(
        error instanceof ApiError ? error.detail : 'Impossible de soumettre vos réponses.',
      );
    }
  };

  const handleToggleMultiple = (questionId: string, choiceId: string, checked: boolean) => {
    setAnswers((prev) => {
      const current = prev[questionId] ?? [];
      const next = checked ? [...current, choiceId] : current.filter((item) => item !== choiceId);
      return { ...prev, [questionId]: next };
    });
  };

  let pageDescription = 'Chargement du questionnaire...';
  if (attempt) {
    const qPlural = attempt.questions.length > 1 ? 's' : '';
    pageDescription = `Seuil de réussite : ${attempt.passingScorePercent} % · ${attempt.questions.length} question${qPlural}`;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={attempt?.quizTitle ?? 'Passage du QCM'}
        description={pageDescription}
        actions={
          <Button variant="outline" asChild>
            <Link to="/onboarding-quizzes">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Retour aux QCM
            </Link>
          </Button>
        }
      />

      {errorMsg && (
        <Alert variant="danger" title="Erreur">
          {errorMsg}
        </Alert>
      )}

      {startMutation.isPending && !attempt && <Spinner label="Préparation de votre session..." />}

      {attempt && result && (
        <QuizCorrectionView
          attempt={attempt}
          result={result}
          onRetry={() => {
            if (id) {
              launchAttempt(id).catch(() => undefined);
            }
          }}
        />
      )}

      {attempt && !result && (
        <div className="space-y-4">
          {attempt.questions.map((q, idx) => (
            <QuizQuestionCard
              key={q.id}
              index={idx}
              question={q}
              selectedIds={answers[q.id] ?? []}
              onSelectSingle={(choiceId) => setAnswers((prev) => ({ ...prev, [q.id]: [choiceId] }))}
              onToggleMultiple={(choiceId, checked) =>
                handleToggleMultiple(q.id, choiceId, checked)
              }
            />
          ))}

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              isLoading={submitMutation.isPending}
              onClick={() => {
                handleSubmit().catch(() => undefined);
              }}
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              Valider mes réponses
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
