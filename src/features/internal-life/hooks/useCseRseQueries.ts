import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  rseIdeasApi,
  staffRepresentativesApi,
  type CreateRseIdeaPayload,
  type UpdateRseIdeaPayload,
} from '../api/cseRseApi';
import type {
  CreateStaffRepresentativeRequest,
  RseIdeasFilter,
  StaffRepresentativesFilter,
  TreatRseIdeaRequest,
  UpdateStaffRepresentativeRequest,
} from '../types/cseRseTypes';

export const cseKeys = {
  all: ['staff-representatives'] as const,
  list: (filter: StaffRepresentativesFilter) => [...cseKeys.all, 'list', filter] as const,
};

export const rseKeys = {
  all: ['rse-ideas'] as const,
  list: (filter: RseIdeasFilter) => [...rseKeys.all, 'list', filter] as const,
};

export function useStaffRepresentativesQuery(filter: StaffRepresentativesFilter) {
  return useQuery({
    queryKey: cseKeys.list(filter),
    queryFn: () => staffRepresentativesApi.getPaged(filter),
  });
}

export function useCreateStaffRepresentativeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStaffRepresentativeRequest) =>
      staffRepresentativesApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: cseKeys.all }),
  });
}

export function useUpdateStaffRepresentativeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateStaffRepresentativeRequest }) =>
      staffRepresentativesApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: cseKeys.all }),
  });
}

export function useDeleteStaffRepresentativeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => staffRepresentativesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: cseKeys.all }),
  });
}

export function useRseIdeasQuery(filter: RseIdeasFilter) {
  return useQuery({
    queryKey: rseKeys.list(filter),
    queryFn: () => rseIdeasApi.getPaged(filter),
  });
}

export function useCreateRseIdeaMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRseIdeaPayload) => rseIdeasApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: rseKeys.all }),
  });
}

export function useUpdateRseIdeaMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateRseIdeaPayload }) =>
      rseIdeasApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: rseKeys.all }),
  });
}

export function useTreatRseIdeaMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: TreatRseIdeaRequest }) =>
      rseIdeasApi.treat(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: rseKeys.all }),
  });
}

export function useDeleteRseIdeaMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rseIdeasApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: rseKeys.all }),
  });
}
