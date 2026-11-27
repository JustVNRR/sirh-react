import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  commonDocumentsApi,
  type CreateCommonDocumentPayload,
  type UpdateCommonDocumentPayload,
} from '../api/commonDocumentsApi';
import type { CommonDocumentsFilter } from '../types/internalLifeTypes';

export const commonDocumentKeys = {
  all: ['common-documents'] as const,
  list: (filter: CommonDocumentsFilter) => [...commonDocumentKeys.all, 'list', filter] as const,
};

export function useCommonDocumentsQuery(filter: CommonDocumentsFilter, enabled = true) {
  return useQuery({
    queryKey: commonDocumentKeys.list(filter),
    queryFn: () => commonDocumentsApi.getDocuments(filter),
    enabled,
  });
}

export function useCreateCommonDocumentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCommonDocumentPayload) =>
      commonDocumentsApi.createDocument(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: commonDocumentKeys.all }),
  });
}

export function useUpdateCommonDocumentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCommonDocumentPayload }) =>
      commonDocumentsApi.updateDocument(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: commonDocumentKeys.all }),
  });
}

export function useArchiveCommonDocumentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      isArchived,
      rowVersion,
    }: {
      id: string;
      isArchived: boolean;
      rowVersion?: string | null;
    }) => commonDocumentsApi.archiveDocument(id, { isArchived, rowVersion }),
    onSuccess: () => qc.invalidateQueries({ queryKey: commonDocumentKeys.all }),
  });
}

export function useDeleteCommonDocumentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => commonDocumentsApi.deleteDocument(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: commonDocumentKeys.all }),
  });
}
