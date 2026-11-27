import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './types';

const NON_RETRYABLE_STATUSES = new Set([400, 401, 403, 404, 409, 422, 423, 429]);

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount, error) => {
          if (error instanceof ApiError && NON_RETRYABLE_STATUSES.has(error.status)) {
            return false;
          }
          return failureCount < 2;
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
