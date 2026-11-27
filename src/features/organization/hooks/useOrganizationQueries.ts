import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  organizationApi,
  type CompaniesFilter,
  type ContractTypesFilter,
  type LocationsFilter,
} from '../api/organizationApi';
import type {
  CreateCompanyRequest,
  CreateContractTypeRequest,
  CreateLocationRequest,
  UpdateCompanyRequest,
  UpdateCompanyStatusRequest,
  UpdateContractTypeRequest,
  UpdateLocationRequest,
} from '../types/organizationTypes';

export const organizationKeys = {
  all: ['organization'] as const,
  companies: (filter: CompaniesFilter) => [...organizationKeys.all, 'companies', filter] as const,
  locations: (filter: LocationsFilter) => [...organizationKeys.all, 'locations', filter] as const,
  contractTypes: (filter: ContractTypesFilter) =>
    [...organizationKeys.all, 'contract-types', filter] as const,
  departments: () => [...organizationKeys.all, 'departments'] as const,
};

export function useCompaniesQuery(filter: CompaniesFilter) {
  return useQuery({
    queryKey: organizationKeys.companies(filter),
    queryFn: () => organizationApi.getCompanies(filter),
  });
}

export function useCreateCompanyMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCompanyRequest) => organizationApi.createCompany(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...organizationKeys.all, 'companies'] }),
  });
}

export function useUpdateCompanyMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCompanyRequest }) =>
      organizationApi.updateCompany(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...organizationKeys.all, 'companies'] }),
  });
}

export function useUpdateCompanyStatusMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCompanyStatusRequest }) =>
      organizationApi.updateCompanyStatus(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...organizationKeys.all, 'companies'] }),
  });
}

export function useLocationsQuery(filter: LocationsFilter) {
  return useQuery({
    queryKey: organizationKeys.locations(filter),
    queryFn: () => organizationApi.getLocations(filter),
  });
}

export function useCreateLocationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLocationRequest) => organizationApi.createLocation(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...organizationKeys.all, 'locations'] }),
  });
}

export function useUpdateLocationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateLocationRequest }) =>
      organizationApi.updateLocation(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...organizationKeys.all, 'locations'] }),
  });
}

export function useDeleteLocationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => organizationApi.deleteLocation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...organizationKeys.all, 'locations'] }),
  });
}

export function useContractTypesQuery(filter: ContractTypesFilter) {
  return useQuery({
    queryKey: organizationKeys.contractTypes(filter),
    queryFn: () => organizationApi.getContractTypes(filter),
  });
}

export function useCreateContractTypeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateContractTypeRequest) => organizationApi.createContractType(payload),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: [...organizationKeys.all, 'contract-types'] }),
  });
}

export function useUpdateContractTypeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateContractTypeRequest }) =>
      organizationApi.updateContractType(id, payload),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: [...organizationKeys.all, 'contract-types'] }),
  });
}

export function useDeleteContractTypeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => organizationApi.deleteContractType(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: [...organizationKeys.all, 'contract-types'] }),
  });
}

export function useDepartmentsQuery() {
  return useQuery({
    queryKey: organizationKeys.departments(),
    queryFn: () => organizationApi.getDepartments(),
    staleTime: 10 * 60_000,
  });
}
