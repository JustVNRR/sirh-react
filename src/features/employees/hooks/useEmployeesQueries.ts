import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { employeesApi } from '../api/employeesApi';
import type {
  CreateEmployeeRequest,
  EmployeeQueryFilter,
  UpdateEmployeeRequest,
} from '../types/employeeTypes';

export const employeesKeys = {
  all: ['employees'] as const,
  list: (filter: EmployeeQueryFilter) => [...employeesKeys.all, 'list', filter] as const,
  detail: (id: string) => [...employeesKeys.all, 'detail', id] as const,
  emergencyContacts: (employeeId: string) =>
    [...employeesKeys.all, 'emergency-contacts', employeeId] as const,
  positions: (employeeId: string) => [...employeesKeys.all, 'positions', employeeId] as const,
};

export function useEmployeesQuery(filter: EmployeeQueryFilter) {
  return useQuery({
    queryKey: employeesKeys.list(filter),
    queryFn: () => employeesApi.getPaged(filter),
  });
}

export function useEmployeeDetailQuery(id: string | null | undefined) {
  return useQuery({
    queryKey: employeesKeys.detail(id ?? 'none'),
    queryFn: () => {
      if (!id) {
        throw new Error('Employee ID is required');
      }
      return employeesApi.getById(id);
    },
    enabled: Boolean(id),
  });
}

export function useCreateEmployeeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEmployeeRequest) => employeesApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: employeesKeys.all }),
  });
}

export function useUpdateEmployeeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateEmployeeRequest }) =>
      employeesApi.update(id, payload),
    onSuccess: async (_data, vars) => {
      await qc.invalidateQueries({ queryKey: employeesKeys.all });
      await qc.invalidateQueries({ queryKey: employeesKeys.detail(vars.id) });
    },
  });
}

export function useDeactivateEmployeeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => employeesApi.deactivate(id),
    onSuccess: async (_data, id) => {
      await qc.invalidateQueries({ queryKey: employeesKeys.all });
      await qc.invalidateQueries({ queryKey: employeesKeys.detail(id) });
    },
  });
}

export function useActivateEmployeeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => employeesApi.activate(id),
    onSuccess: async (_data, id) => {
      await qc.invalidateQueries({ queryKey: employeesKeys.all });
      await qc.invalidateQueries({ queryKey: employeesKeys.detail(id) });
    },
  });
}
