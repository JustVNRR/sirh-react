import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { positionsApi } from '../api/positionsApi';
import type { CreatePositionRequest, UpdatePositionRequest } from '../types/employeeTypes';
import { employeesKeys } from './useEmployeesQueries';

export function usePositionsQuery(employeeId: string, enabled = true) {
  return useQuery({
    queryKey: employeesKeys.positions(employeeId),
    queryFn: () => positionsApi.getByEmployeeId(employeeId),
    enabled: Boolean(employeeId) && enabled,
  });
}

export function useCreatePositionMutation(employeeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePositionRequest) => positionsApi.create(payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: employeesKeys.positions(employeeId) });
      await qc.invalidateQueries({ queryKey: employeesKeys.detail(employeeId) });
    },
  });
}

export function useUpdatePositionMutation(employeeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePositionRequest }) =>
      positionsApi.update(id, payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: employeesKeys.positions(employeeId) });
      await qc.invalidateQueries({ queryKey: employeesKeys.detail(employeeId) });
    },
  });
}

export function useDeletePositionMutation(employeeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => positionsApi.delete(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: employeesKeys.positions(employeeId) });
      await qc.invalidateQueries({ queryKey: employeesKeys.detail(employeeId) });
    },
  });
}
