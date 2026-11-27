import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { contractModelsApi } from '../api/contractModelsApi';
import type {
  ContractModelsFilter,
  CreateContractModelRequest,
  GenerateContractRequest,
  PreviewContractRequest,
  UpdateContractModelRequest,
} from '../types/contractTypes';

export const contractModelKeys = {
  all: ['contract-models'] as const,
  variables: () => [...contractModelKeys.all, 'variables'] as const,
  list: (filter: ContractModelsFilter) => [...contractModelKeys.all, 'list', filter] as const,
  detail: (id: string) => [...contractModelKeys.all, 'detail', id] as const,
};

export function useTemplateVariablesQuery() {
  return useQuery({
    queryKey: contractModelKeys.variables(),
    queryFn: () => contractModelsApi.getVariables(),
    staleTime: 10 * 60_000,
  });
}

export function useContractModelsQuery(filter: ContractModelsFilter) {
  return useQuery({
    queryKey: contractModelKeys.list(filter),
    queryFn: () => contractModelsApi.getModels(filter),
  });
}

export function useContractModelQuery(id: string | undefined) {
  return useQuery({
    queryKey: contractModelKeys.detail(id ?? ''),
    queryFn: () => contractModelsApi.getModel(id ?? ''),
    enabled: Boolean(id),
  });
}

export function useCreateContractModelMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateContractModelRequest) => contractModelsApi.createModel(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: contractModelKeys.all }),
  });
}

export function useUpdateContractModelMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateContractModelRequest }) =>
      contractModelsApi.updateModel(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: contractModelKeys.all }),
  });
}

export function useDeleteContractModelMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => contractModelsApi.deleteModel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: contractModelKeys.all }),
  });
}

export function usePreviewContractModelMutation() {
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PreviewContractRequest }) =>
      contractModelsApi.previewModel(id, payload),
  });
}

export function useGenerateContractMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: GenerateContractRequest) => contractModelsApi.generateContract(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contracts'] }),
  });
}
