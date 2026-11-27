import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { quizzesApi } from '../api/quizzesApi';
import type {
  CreateOnboardingQuizRequest,
  PublishOnboardingQuizRequest,
  QuizAttemptsFilter,
  QuizzesFilter,
  SubmitQuizAttemptRequest,
  UpdateOnboardingQuizRequest,
} from '../types/quizTypes';

export const quizKeys = {
  all: ['onboarding-quizzes'] as const,
  list: (filter: QuizzesFilter) => [...quizKeys.all, 'list', filter] as const,
  detail: (id: string) => [...quizKeys.all, 'detail', id] as const,
  attempts: (quizId: string, filter: QuizAttemptsFilter) =>
    [...quizKeys.all, 'attempts', quizId, filter] as const,
};

export function useQuizzesQuery(filter: QuizzesFilter) {
  return useQuery({
    queryKey: quizKeys.list(filter),
    queryFn: () => quizzesApi.getQuizzes(filter),
  });
}

export function useQuizDetailQuery(id: string | undefined) {
  return useQuery({
    queryKey: quizKeys.detail(id ?? ''),
    queryFn: () => quizzesApi.getQuiz(id ?? ''),
    enabled: Boolean(id),
  });
}

export function useQuizAttemptsQuery(
  quizId: string | undefined,
  filter: QuizAttemptsFilter,
  enabled = true,
) {
  return useQuery({
    queryKey: quizKeys.attempts(quizId ?? '', filter),
    queryFn: () => quizzesApi.getAttempts(quizId ?? '', filter),
    enabled: Boolean(quizId) && enabled,
  });
}

export function useCreateQuizMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOnboardingQuizRequest) => quizzesApi.createQuiz(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: quizKeys.all }),
  });
}

export function useUpdateQuizMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateOnboardingQuizRequest }) =>
      quizzesApi.updateQuiz(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: quizKeys.all }),
  });
}

export function usePublishQuizMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PublishOnboardingQuizRequest }) =>
      quizzesApi.publishQuiz(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: quizKeys.all }),
  });
}

export function useDeleteQuizMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => quizzesApi.deleteQuiz(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: quizKeys.all }),
  });
}

export function useStartQuizAttemptMutation() {
  return useMutation({
    mutationFn: (quizId: string) => quizzesApi.startAttempt(quizId),
  });
}

export function useSubmitQuizAttemptMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      attemptId,
      payload,
    }: {
      attemptId: string;
      payload: SubmitQuizAttemptRequest;
    }) => quizzesApi.submitAttempt(attemptId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: quizKeys.all }),
  });
}
