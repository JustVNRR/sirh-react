import { httpClient } from '@/shared/api/httpClient';
import type { PagedResult } from '@/shared/api/types';

export const dashboardApi = {
  getPendingRseIdeasCount: async (): Promise<number> => {
    const res = await httpClient.get<PagedResult<{ id: string }>>(
      '/api/v1/rse-ideas?status=submitted&page=1&pageSize=1',
    );
    return res.totalCount;
  },
};
