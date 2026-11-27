import { httpClient } from '@/shared/api/httpClient';
import type { PagedResult } from '@/shared/api/types';
import type {
  CreateEmployeeRequest,
  EmployeeDetailDto,
  EmployeeQueryFilter,
  EmployeeSummaryDto,
  UpdateEmployeeRequest,
} from '../types/employeeTypes';

function buildQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      sp.set(key, String(value));
    }
  }
  const query = sp.toString();
  return query ? `?${query}` : '';
}

export const employeesApi = {
  getPaged: (filter: EmployeeQueryFilter = {}) =>
    httpClient.get<PagedResult<EmployeeSummaryDto>>(
      `/api/v1/employees${buildQuery({
        companyId: filter.companyId,
        managerId: filter.managerId,
        department: filter.department,
        active: filter.active,
        inPosition: filter.inPosition,
        role: filter.role,
        search: filter.search,
        page: filter.page ?? 1,
        pageSize: filter.pageSize ?? 20,
      })}`,
    ),

  getById: (id: string) => httpClient.get<EmployeeDetailDto>(`/api/v1/employees/${id}`),

  create: (payload: CreateEmployeeRequest) =>
    httpClient.post<EmployeeDetailDto>('/api/v1/employees', payload),

  update: (id: string, payload: UpdateEmployeeRequest) =>
    httpClient.put<EmployeeDetailDto>(`/api/v1/employees/${id}`, payload),

  deactivate: (id: string) => httpClient.post<undefined>(`/api/v1/employees/${id}/deactivate`),

  activate: (id: string) => httpClient.post<undefined>(`/api/v1/employees/${id}/activate`),
};
