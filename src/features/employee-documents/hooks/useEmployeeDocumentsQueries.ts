import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  employeeDocumentsApi,
  type CreateEmployeeDocumentPayload,
  type UpdateEmployeeDocumentPayload,
} from '../api/employeeDocumentsApi';
import type { EmployeeDocumentsFilter } from '../types/employeeDocumentTypes';

export const employeeDocumentKeys = {
  all: ['employee-documents'] as const,
  list: (filter: EmployeeDocumentsFilter) => [...employeeDocumentKeys.all, 'list', filter] as const,
};

export function useEmployeeDocumentsQuery(filter: EmployeeDocumentsFilter, enabled = true) {
  return useQuery({
    queryKey: employeeDocumentKeys.list(filter),
    queryFn: () => employeeDocumentsApi.getDocuments(filter),
    enabled,
  });
}

export function useCreateEmployeeDocumentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEmployeeDocumentPayload) =>
      employeeDocumentsApi.createDocument(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: employeeDocumentKeys.all }),
  });
}

export function useUpdateEmployeeDocumentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateEmployeeDocumentPayload }) =>
      employeeDocumentsApi.updateDocument(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: employeeDocumentKeys.all }),
  });
}

export function useDeleteEmployeeDocumentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => employeeDocumentsApi.deleteDocument(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: employeeDocumentKeys.all }),
  });
}
