export type QuizQuestionType = 'singleChoice' | 'multipleChoice';

export type QuizAttemptStatus = 'inProgress' | 'completed';

export interface QuizChoiceDto {
  id: string;
  orderIndex: number;
  choiceText: string;
  isCorrect: boolean | null;
}

export interface QuizQuestionDto {
  id: string;
  orderIndex: number;
  questionText: string;
  questionType: QuizQuestionType;
  explanation: string | null;
  choices: QuizChoiceDto[];
}

export interface OnboardingQuizSummaryDto {
  id: string;
  companyId: string | null;
  title: string;
  description: string | null;
  passingScorePercent: number;
  isPublished: boolean;
  version: number;
  questionCount: number;
  myStatus: string | null;
  myBestScorePercent: number | null;
  myHasPassed: boolean | null;
  createdAtUtc: string;
  updatedAtUtc: string;
  rowVersion: string;
}

export interface OnboardingQuizDetailDto {
  id: string;
  companyId: string | null;
  title: string;
  description: string | null;
  passingScorePercent: number;
  isPublished: boolean;
  version: number;
  questions: QuizQuestionDto[];
  createdAtUtc: string;
  updatedAtUtc: string;
  rowVersion: string;
}

export interface QuizChoiceInput {
  choiceText: string;
  isCorrect: boolean;
  orderIndex?: number | null;
}

export interface QuizQuestionInput {
  questionText: string;
  questionType: QuizQuestionType;
  explanation?: string | null;
  choices: QuizChoiceInput[];
  orderIndex?: number | null;
}

export interface CreateOnboardingQuizRequest {
  companyId?: string | null;
  title: string;
  description?: string | null;
  passingScorePercent: number;
  questions: QuizQuestionInput[];
}

export interface UpdateOnboardingQuizRequest extends CreateOnboardingQuizRequest {
  rowVersion?: string | null;
}

export interface PublishOnboardingQuizRequest {
  isPublished: boolean;
  rowVersion?: string | null;
}

export interface QuizzesFilter {
  companyId?: string;
  published?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface QuizAttemptChoiceDto {
  id: string;
  orderIndex: number;
  choiceText: string;
}

export interface QuizAttemptQuestionDto {
  id: string;
  orderIndex: number;
  questionText: string;
  questionType: QuizQuestionType;
  choices: QuizAttemptChoiceDto[];
}

export interface StartedQuizAttemptDto {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  quizVersion: number;
  passingScorePercent: number;
  startedAtUtc: string;
  questions: QuizAttemptQuestionDto[];
}

export interface SubmitQuestionAnswerRequest {
  questionId: string;
  selectedChoiceIds: string[];
}

export interface SubmitQuizAttemptRequest {
  answers: SubmitQuestionAnswerRequest[];
}

export interface QuizQuestionCorrectionDto {
  questionId: string;
  questionText: string;
  selectedChoiceIds: string[];
  correctChoiceIds: string[];
  isCorrect: boolean;
  explanation: string | null;
}

export interface QuizAttemptResultDto {
  attemptId: string;
  quizId: string;
  employeeId: string;
  quizVersion: number;
  status: QuizAttemptStatus;
  correctAnswersCount: number;
  totalQuestionsCount: number;
  scorePercent: number;
  passed: boolean;
  startedAtUtc: string;
  completedAtUtc: string;
  corrections: QuizQuestionCorrectionDto[];
}

export interface QuizAttemptSummaryDto {
  attemptId: string;
  quizId: string;
  employeeId: string;
  quizVersion: number;
  status: QuizAttemptStatus;
  correctAnswersCount: number;
  totalQuestionsCount: number;
  scorePercent: number;
  passed: boolean;
  startedAtUtc: string;
  completedAtUtc: string | null;
}

export interface QuizAttemptsFilter {
  employeeId?: string;
  passed?: boolean;
  page?: number;
  pageSize?: number;
}
