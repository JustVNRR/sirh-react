import { httpClient } from '@/shared/api/httpClient';
import type { PagedResult } from '@/shared/api/types';
import type {
  CreateOnboardingQuizRequest,
  OnboardingQuizDetailDto,
  OnboardingQuizSummaryDto,
  PublishOnboardingQuizRequest,
  QuizAttemptResultDto,
  QuizAttemptSummaryDto,
  QuizAttemptsFilter,
  QuizzesFilter,
  StartedQuizAttemptDto,
  SubmitQuizAttemptRequest,
  UpdateOnboardingQuizRequest,
} from '../types/quizTypes';

function buildQuizzesQuery(filter: QuizzesFilter): string {
  const sp = new URLSearchParams();
  if (filter.companyId) {
    sp.set('companyId', filter.companyId);
  }
  if (filter.published !== undefined) {
    sp.set('published', String(filter.published));
  }
  if (filter.search) {
    sp.set('search', filter.search);
  }
  sp.set('page', String(filter.page ?? 1));
  sp.set('pageSize', String(filter.pageSize ?? 20));
  return `?${sp.toString()}`;
}

function buildAttemptsQuery(filter: QuizAttemptsFilter): string {
  const sp = new URLSearchParams();
  if (filter.employeeId) {
    sp.set('employeeId', filter.employeeId);
  }
  if (filter.passed !== undefined) {
    sp.set('passed', String(filter.passed));
  }
  sp.set('page', String(filter.page ?? 1));
  sp.set('pageSize', String(filter.pageSize ?? 20));
  return `?${sp.toString()}`;
}

export const quizzesApi = {
  getQuizzes: (filter: QuizzesFilter): Promise<PagedResult<OnboardingQuizSummaryDto>> =>
    httpClient.get<PagedResult<OnboardingQuizSummaryDto>>(
      `/api/v1/onboarding-quizzes${buildQuizzesQuery(filter)}`,
    ),

  getQuiz: (id: string): Promise<OnboardingQuizDetailDto> =>
    httpClient.get<OnboardingQuizDetailDto>(`/api/v1/onboarding-quizzes/${id}`),

  createQuiz: (payload: CreateOnboardingQuizRequest): Promise<OnboardingQuizDetailDto> =>
    httpClient.post<OnboardingQuizDetailDto>('/api/v1/onboarding-quizzes', payload),

  updateQuiz: (
    id: string,
    payload: UpdateOnboardingQuizRequest,
  ): Promise<OnboardingQuizDetailDto> =>
    httpClient.put<OnboardingQuizDetailDto>(`/api/v1/onboarding-quizzes/${id}`, payload),

  publishQuiz: (
    id: string,
    payload: PublishOnboardingQuizRequest,
  ): Promise<OnboardingQuizDetailDto> =>
    httpClient.patch<OnboardingQuizDetailDto>(`/api/v1/onboarding-quizzes/${id}/publish`, payload),

  deleteQuiz: (id: string): Promise<undefined> =>
    httpClient.delete<undefined>(`/api/v1/onboarding-quizzes/${id}`),

  startAttempt: (quizId: string): Promise<StartedQuizAttemptDto> =>
    httpClient.post<StartedQuizAttemptDto>(`/api/v1/onboarding-quizzes/${quizId}/attempts`),

  submitAttempt: (
    attemptId: string,
    payload: SubmitQuizAttemptRequest,
  ): Promise<QuizAttemptResultDto> =>
    httpClient.post<QuizAttemptResultDto>(
      `/api/v1/onboarding-quizzes/attempts/${attemptId}/submit`,
      payload,
    ),

  getAttempts: (
    quizId: string,
    filter: QuizAttemptsFilter,
  ): Promise<PagedResult<QuizAttemptSummaryDto>> =>
    httpClient.get<PagedResult<QuizAttemptSummaryDto>>(
      `/api/v1/onboarding-quizzes/${quizId}/attempts${buildAttemptsQuery(filter)}`,
    ),
};
