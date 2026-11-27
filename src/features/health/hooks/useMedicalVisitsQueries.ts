import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  medicalVisitsApi,
  type CreateMedicalVisitPayload,
  type UpdateMedicalVisitPayload,
} from '../api/medicalVisitsApi';
import type { MedicalVisitsFilter } from '../types/medicalVisitTypes';

export const medicalVisitKeys = {
  all: ['medical-visits'] as const,
  list: (filter: MedicalVisitsFilter) => [...medicalVisitKeys.all, 'list', filter] as const,
};

export function useMedicalVisitsQuery(filter: MedicalVisitsFilter, enabled = true) {
  return useQuery({
    queryKey: medicalVisitKeys.list(filter),
    queryFn: () => medicalVisitsApi.getVisits(filter),
    enabled,
  });
}

export function useCreateMedicalVisitMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMedicalVisitPayload) => medicalVisitsApi.createVisit(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: medicalVisitKeys.all }),
  });
}

export function useUpdateMedicalVisitMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMedicalVisitPayload }) =>
      medicalVisitsApi.updateVisit(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: medicalVisitKeys.all }),
  });
}

export function useDeleteMedicalVisitMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => medicalVisitsApi.deleteVisit(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: medicalVisitKeys.all }),
  });
}
