import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  jobSheetsApi,
  type CreateJobSheetPayload,
  type UpdateJobSheetPayload,
} from '../api/contractsApi';

export const jobSheetKeys = {
  all: ['job-sheets'] as const,
  byPosition: (positionId: string) => [...jobSheetKeys.all, 'by-position', positionId] as const,
};

export function useJobSheetByPositionQuery(positionId: string, enabled = true) {
  return useQuery({
    queryKey: jobSheetKeys.byPosition(positionId),
    queryFn: () => jobSheetsApi.getByPosition(positionId),
    enabled: Boolean(positionId) && enabled,
  });
}

export function useCreateJobSheetMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateJobSheetPayload) => jobSheetsApi.createJobSheet(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: jobSheetKeys.all }),
  });
}

export function useUpdateJobSheetMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateJobSheetPayload }) =>
      jobSheetsApi.updateJobSheet(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: jobSheetKeys.all }),
  });
}

export function useDeleteJobSheetMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jobSheetsApi.deleteJobSheet(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: jobSheetKeys.all }),
  });
}
