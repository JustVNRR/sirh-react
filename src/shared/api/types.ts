export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface ProblemDetails {
  type?: string;
  title?: string;
  status: number;
  detail?: string;
  instance?: string;
  traceId?: string;
  errors?: Record<string, string[]>;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly detail: string;
  readonly traceId?: string;
  readonly errors?: Record<string, string[]>;

  constructor(problem: ProblemDetails) {
    const detail = problem.detail || problem.title || `Erreur HTTP ${problem.status}`;
    super(detail);
    this.name = 'ApiError';
    this.status = problem.status;
    this.code = problem.title || `HTTP_${problem.status}`;
    this.detail = detail;
    this.traceId = problem.traceId;
    this.errors = problem.errors;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isConflict(): boolean {
    return this.status === 409;
  }

  get isUnprocessable(): boolean {
    return this.status === 422;
  }

  get isLocked(): boolean {
    return this.status === 423;
  }

  get isRateLimited(): boolean {
    return this.status === 429;
  }
}
