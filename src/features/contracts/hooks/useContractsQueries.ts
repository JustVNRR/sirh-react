import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  contractsApi,
  type ImportContractPayload,
  type UpdateContractPayload,
} from '../api/contractsApi';
import type { ContractsFilter } from '../types/contractTypes';

export const contractKeys = {
  all: ['contracts'] as const,
  list: (filter: ContractsFilter) => [...contractKeys.all, 'list', filter] as const,
  byPosition: (positionId: string) => [...contractKeys.all, 'by-position', positionId] as const,
};

export function useContractsQuery(filter: ContractsFilter) {
  return useQuery({
    queryKey: contractKeys.list(filter),
    queryFn: () => contractsApi.getContracts(filter),
  });
}

export function useImportContractMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ImportContractPayload) => contractsApi.importContract(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: contractKeys.all }),
  });
}

export function useUpdateContractMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateContractPayload }) =>
      contractsApi.updateContract(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: contractKeys.all }),
  });
}

export function useDeleteContractMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => contractsApi.deleteContract(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: contractKeys.all }),
  });
}
