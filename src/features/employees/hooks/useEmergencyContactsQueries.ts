import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { emergencyContactsApi } from '../api/emergencyContactsApi';
import type {
  CreateEmergencyContactRequest,
  UpdateEmergencyContactRequest,
} from '../types/employeeTypes';
import { employeesKeys } from './useEmployeesQueries';

export function useEmergencyContactsQuery(employeeId: string, enabled = true) {
  return useQuery({
    queryKey: employeesKeys.emergencyContacts(employeeId),
    queryFn: () => emergencyContactsApi.getByEmployeeId(employeeId),
    enabled: Boolean(employeeId) && enabled,
  });
}

export function useCreateEmergencyContactMutation(employeeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEmergencyContactRequest) =>
      emergencyContactsApi.create(employeeId, payload),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: employeesKeys.emergencyContacts(employeeId) }),
  });
}

export function useUpdateEmergencyContactMutation(employeeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateEmergencyContactRequest }) =>
      emergencyContactsApi.update(id, payload),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: employeesKeys.emergencyContacts(employeeId) }),
  });
}

export function useDeleteEmergencyContactMutation(employeeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => emergencyContactsApi.delete(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: employeesKeys.emergencyContacts(employeeId) }),
  });
}
