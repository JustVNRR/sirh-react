import { httpClient, type BlobDownloadResult } from '@/shared/api/httpClient';
import type { PagedResult } from '@/shared/api/types';
import type {
  ContractDto,
  ContractModelDto,
  ContractModelsFilter,
  CreateContractModelRequest,
  GenerateContractRequest,
  PreviewContractRequest,
  TemplateVariableDto,
  UpdateContractModelRequest,
} from '../types/contractTypes';

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      sp.set(key, String(value));
    }
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

export const contractModelsApi = {
  getVariables: (): Promise<TemplateVariableDto[]> =>
    httpClient.get<TemplateVariableDto[]>('/api/v1/contract-models/variables'),

  getModels: (filter: ContractModelsFilter): Promise<PagedResult<ContractModelDto>> =>
    httpClient.get<PagedResult<ContractModelDto>>(
      `/api/v1/contract-models${buildQuery({
        active: filter.active,
        contractTypeId: filter.contractTypeId,
        search: filter.search,
        page: filter.page ?? 1,
        pageSize: filter.pageSize ?? 20,
      })}`,
    ),

  getModel: (id: string): Promise<ContractModelDto> =>
    httpClient.get<ContractModelDto>(`/api/v1/contract-models/${id}`),

  createModel: (payload: CreateContractModelRequest): Promise<ContractModelDto> =>
    httpClient.post<ContractModelDto>('/api/v1/contract-models', payload),

  updateModel: (id: string, payload: UpdateContractModelRequest): Promise<ContractModelDto> =>
    httpClient.put<ContractModelDto>(`/api/v1/contract-models/${id}`, payload),

  deleteModel: (id: string): Promise<undefined> =>
    httpClient.delete<undefined>(`/api/v1/contract-models/${id}`),

  previewModel: (id: string, payload: PreviewContractRequest): Promise<BlobDownloadResult> =>
    httpClient.postBlob(`/api/v1/contract-models/${id}/preview`, payload),

  generateContract: (payload: GenerateContractRequest): Promise<ContractDto> =>
    httpClient.post<ContractDto>('/api/v1/contracts/generate', payload),
};
