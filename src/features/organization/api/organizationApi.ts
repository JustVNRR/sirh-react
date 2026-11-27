import { httpClient } from '@/shared/api/httpClient';
import type { PagedResult } from '@/shared/api/types';
import type {
  CompanyDto,
  ContractTypeDto,
  CreateCompanyRequest,
  CreateContractTypeRequest,
  CreateLocationRequest,
  DepartmentDto,
  LocationDto,
  UpdateCompanyRequest,
  UpdateCompanyStatusRequest,
  UpdateContractTypeRequest,
  UpdateLocationRequest,
} from '../types/organizationTypes';

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

export interface CompaniesFilter {
  active?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface LocationsFilter {
  published?: boolean;
  companyId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ContractTypesFilter {
  active?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export const organizationApi = {
  getCompanies: (filter: CompaniesFilter = {}) =>
    httpClient.get<PagedResult<CompanyDto>>(
      `/api/v1/companies${buildQuery({
        active: filter.active,
        search: filter.search,
        page: filter.page ?? 1,
        pageSize: filter.pageSize ?? 20,
      })}`,
    ),
  getCompanyById: (id: string) => httpClient.get<CompanyDto>(`/api/v1/companies/${id}`),
  createCompany: (payload: CreateCompanyRequest) =>
    httpClient.post<CompanyDto>('/api/v1/companies', payload),
  updateCompany: (id: string, payload: UpdateCompanyRequest) =>
    httpClient.put<CompanyDto>(`/api/v1/companies/${id}`, payload),
  updateCompanyStatus: (id: string, payload: UpdateCompanyStatusRequest) =>
    httpClient.patch<CompanyDto>(`/api/v1/companies/${id}/status`, payload),

  getLocations: (filter: LocationsFilter = {}) =>
    httpClient.get<PagedResult<LocationDto>>(
      `/api/v1/locations${buildQuery({
        published: filter.published,
        companyId: filter.companyId,
        search: filter.search,
        page: filter.page ?? 1,
        pageSize: filter.pageSize ?? 20,
      })}`,
    ),
  getLocationById: (id: string) => httpClient.get<LocationDto>(`/api/v1/locations/${id}`),
  createLocation: (payload: CreateLocationRequest) =>
    httpClient.post<LocationDto>('/api/v1/locations', payload),
  updateLocation: (id: string, payload: UpdateLocationRequest) =>
    httpClient.put<LocationDto>(`/api/v1/locations/${id}`, payload),
  deleteLocation: (id: string) => httpClient.delete<undefined>(`/api/v1/locations/${id}`),

  getContractTypes: (filter: ContractTypesFilter = {}) =>
    httpClient.get<PagedResult<ContractTypeDto>>(
      `/api/v1/contract-types${buildQuery({
        active: filter.active,
        search: filter.search,
        page: filter.page ?? 1,
        pageSize: filter.pageSize ?? 20,
      })}`,
    ),
  createContractType: (payload: CreateContractTypeRequest) =>
    httpClient.post<ContractTypeDto>('/api/v1/contract-types', payload),
  updateContractType: (id: string, payload: UpdateContractTypeRequest) =>
    httpClient.put<ContractTypeDto>(`/api/v1/contract-types/${id}`, payload),
  deleteContractType: (id: string) => httpClient.delete<undefined>(`/api/v1/contract-types/${id}`),

  getDepartments: () => httpClient.get<DepartmentDto[]>('/api/v1/referentials/departments'),
};
