import { httpClient, type BlobDownloadResult } from '@/shared/api/httpClient';
import type { PagedResult } from '@/shared/api/types';
import type {
  CommonDocumentCategory,
  CommonDocumentDto,
  CommonDocumentsFilter,
} from '../types/internalLifeTypes';

function buildQuery(filter: CommonDocumentsFilter): string {
  const sp = new URLSearchParams();
  if (filter.companyId) {
    sp.set('companyId', filter.companyId);
  }
  if (filter.category) {
    sp.set('category', filter.category);
  }
  if (filter.isWelcomeKit !== undefined) {
    sp.set('isWelcomeKit', String(filter.isWelcomeKit));
  }
  if (filter.contractTypeId) {
    sp.set('contractTypeId', filter.contractTypeId);
  }
  if (filter.archived !== undefined) {
    sp.set('archived', String(filter.archived));
  }
  if (filter.search) {
    sp.set('search', filter.search);
  }
  sp.set('page', String(filter.page ?? 1));
  sp.set('pageSize', String(filter.pageSize ?? 20));
  return `?${sp.toString()}`;
}

export interface CreateCommonDocumentPayload {
  companyId?: string | null;
  contractTypeId?: string | null;
  category: CommonDocumentCategory;
  isWelcomeKit?: boolean;
  title: string;
  description?: string | null;
  fileDate?: string | null;
  file: File;
}

export interface UpdateCommonDocumentPayload {
  companyId?: string | null;
  contractTypeId?: string | null;
  category: CommonDocumentCategory;
  isWelcomeKit?: boolean;
  title: string;
  description?: string | null;
  fileDate?: string | null;
  rowVersion?: string | null;
  file?: File | null;
}

export const commonDocumentsApi = {
  getDocuments: (filter: CommonDocumentsFilter): Promise<PagedResult<CommonDocumentDto>> =>
    httpClient.get<PagedResult<CommonDocumentDto>>(`/api/v1/common-documents${buildQuery(filter)}`),

  downloadFile: (id: string, download = false): Promise<BlobDownloadResult> =>
    httpClient.getBlob(`/api/v1/common-documents/${id}/file?download=${String(download)}`),

  createDocument: (payload: CreateCommonDocumentPayload): Promise<CommonDocumentDto> => {
    const form = new FormData();
    if (payload.companyId) {
      form.append('companyId', payload.companyId);
    }
    if (payload.contractTypeId) {
      form.append('contractTypeId', payload.contractTypeId);
    }
    form.append('category', payload.category);
    if (payload.isWelcomeKit !== undefined) {
      form.append('isWelcomeKit', String(payload.isWelcomeKit));
    }
    form.append('title', payload.title);
    if (payload.description) {
      form.append('description', payload.description);
    }
    if (payload.fileDate) {
      form.append('fileDate', payload.fileDate);
    }
    form.append('file', payload.file);
    return httpClient.post<CommonDocumentDto>('/api/v1/common-documents', form);
  },

  updateDocument: (
    id: string,
    payload: UpdateCommonDocumentPayload,
  ): Promise<CommonDocumentDto> => {
    if (payload.file) {
      const form = new FormData();
      if (payload.companyId) {
        form.append('companyId', payload.companyId);
      }
      if (payload.contractTypeId) {
        form.append('contractTypeId', payload.contractTypeId);
      }
      form.append('category', payload.category);
      if (payload.isWelcomeKit !== undefined) {
        form.append('isWelcomeKit', String(payload.isWelcomeKit));
      }
      form.append('title', payload.title);
      if (payload.description) {
        form.append('description', payload.description);
      }
      if (payload.fileDate) {
        form.append('fileDate', payload.fileDate);
      }
      if (payload.rowVersion) {
        form.append('rowVersion', payload.rowVersion);
      }
      form.append('file', payload.file);
      return httpClient.put<CommonDocumentDto>(`/api/v1/common-documents/${id}`, form);
    }

    return httpClient.put<CommonDocumentDto>(`/api/v1/common-documents/${id}`, {
      companyId: payload.companyId ?? null,
      contractTypeId: payload.contractTypeId ?? null,
      category: payload.category,
      isWelcomeKit: payload.isWelcomeKit ?? null,
      title: payload.title,
      description: payload.description ?? null,
      fileDate: payload.fileDate ?? null,
      rowVersion: payload.rowVersion ?? null,
    });
  },

  archiveDocument: (
    id: string,
    payload: { isArchived: boolean; rowVersion?: string | null },
  ): Promise<undefined> =>
    httpClient.patch<undefined>(`/api/v1/common-documents/${id}/archive`, payload),

  deleteDocument: (id: string): Promise<undefined> =>
    httpClient.delete<undefined>(`/api/v1/common-documents/${id}`),
};
