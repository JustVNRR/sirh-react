import { httpClient, type BlobDownloadResult } from '@/shared/api/httpClient';
import { ApiError, type PagedResult } from '@/shared/api/types';
import type {
  ContractDto,
  ContractStatus,
  ContractsFilter,
  JobSheetDto,
} from '../types/contractTypes';

function buildContractsQuery(filter: ContractsFilter): string {
  const sp = new URLSearchParams();
  if (filter.employeeId) {
    sp.set('employeeId', filter.employeeId);
  }
  if (filter.status) {
    sp.set('status', filter.status);
  }
  if (filter.contractTypeId) {
    sp.set('contractTypeId', filter.contractTypeId);
  }
  sp.set('page', String(filter.page ?? 1));
  sp.set('pageSize', String(filter.pageSize ?? 20));
  return `?${sp.toString()}`;
}

export interface ImportContractPayload {
  positionId: string;
  contractTypeId: string;
  status: ContractStatus;
  signedAt?: string | null;
  commentary?: string | null;
  file: File;
}

export interface UpdateContractPayload {
  contractTypeId: string;
  status: ContractStatus;
  signedAt?: string | null;
  commentary?: string | null;
  rowVersion?: string | null;
  file?: File | null;
}

export interface CreateJobSheetPayload {
  positionId: string;
  commentary?: string | null;
  file: File;
}

export interface UpdateJobSheetPayload {
  commentary?: string | null;
  rowVersion?: string | null;
  file?: File | null;
}

export const contractsApi = {
  getContracts: (filter: ContractsFilter): Promise<PagedResult<ContractDto>> =>
    httpClient.get<PagedResult<ContractDto>>(`/api/v1/contracts${buildContractsQuery(filter)}`),

  getByPosition: async (positionId: string): Promise<ContractDto | null> => {
    try {
      return await httpClient.get<ContractDto>(`/api/v1/contracts/by-position/${positionId}`);
    } catch (error) {
      if (error instanceof ApiError && error.isNotFound) {
        return null;
      }
      throw error;
    }
  },

  downloadFile: (id: string, download = false): Promise<BlobDownloadResult> =>
    httpClient.getBlob(`/api/v1/contracts/${id}/file?download=${String(download)}`),

  importContract: (payload: ImportContractPayload): Promise<ContractDto> => {
    const form = new FormData();
    form.append('positionId', payload.positionId);
    form.append('contractTypeId', payload.contractTypeId);
    form.append('status', payload.status);
    if (payload.signedAt) {
      form.append('signedAt', payload.signedAt);
    }
    if (payload.commentary) {
      form.append('commentary', payload.commentary);
    }
    form.append('file', payload.file);
    return httpClient.post<ContractDto>('/api/v1/contracts', form);
  },

  updateContract: (id: string, payload: UpdateContractPayload): Promise<ContractDto> => {
    if (payload.file) {
      const form = new FormData();
      form.append('contractTypeId', payload.contractTypeId);
      form.append('status', payload.status);
      if (payload.signedAt) {
        form.append('signedAt', payload.signedAt);
      }
      if (payload.commentary) {
        form.append('commentary', payload.commentary);
      }
      if (payload.rowVersion) {
        form.append('rowVersion', payload.rowVersion);
      }
      form.append('file', payload.file);
      return httpClient.put<ContractDto>(`/api/v1/contracts/${id}`, form);
    }

    return httpClient.put<ContractDto>(`/api/v1/contracts/${id}`, {
      contractTypeId: payload.contractTypeId,
      status: payload.status,
      signedAt: payload.signedAt ?? null,
      commentary: payload.commentary ?? null,
      rowVersion: payload.rowVersion ?? null,
    });
  },

  deleteContract: (id: string): Promise<undefined> =>
    httpClient.delete<undefined>(`/api/v1/contracts/${id}`),
};

export const jobSheetsApi = {
  getByPosition: async (positionId: string): Promise<JobSheetDto | null> => {
    try {
      return await httpClient.get<JobSheetDto>(`/api/v1/job-sheets/by-position/${positionId}`);
    } catch (error) {
      if (error instanceof ApiError && error.isNotFound) {
        return null;
      }
      throw error;
    }
  },

  downloadFile: (id: string, download = false): Promise<BlobDownloadResult> =>
    httpClient.getBlob(`/api/v1/job-sheets/${id}/file?download=${String(download)}`),

  createJobSheet: (payload: CreateJobSheetPayload): Promise<JobSheetDto> => {
    const form = new FormData();
    form.append('positionId', payload.positionId);
    if (payload.commentary) {
      form.append('commentary', payload.commentary);
    }
    form.append('file', payload.file);
    return httpClient.post<JobSheetDto>('/api/v1/job-sheets', form);
  },

  updateJobSheet: (id: string, payload: UpdateJobSheetPayload): Promise<JobSheetDto> => {
    if (payload.file) {
      const form = new FormData();
      if (payload.commentary) {
        form.append('commentary', payload.commentary);
      }
      if (payload.rowVersion) {
        form.append('rowVersion', payload.rowVersion);
      }
      form.append('file', payload.file);
      return httpClient.put<JobSheetDto>(`/api/v1/job-sheets/${id}`, form);
    }

    return httpClient.put<JobSheetDto>(`/api/v1/job-sheets/${id}`, {
      commentary: payload.commentary ?? null,
      rowVersion: payload.rowVersion ?? null,
    });
  },

  deleteJobSheet: (id: string): Promise<undefined> =>
    httpClient.delete<undefined>(`/api/v1/job-sheets/${id}`),
};
