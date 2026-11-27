import { httpClient, type BlobDownloadResult } from '@/shared/api/httpClient';
import type { PagedResult } from '@/shared/api/types';
import type {
  EmployeeDocumentCategory,
  EmployeeDocumentDto,
  EmployeeDocumentType,
  EmployeeDocumentsFilter,
} from '../types/employeeDocumentTypes';

function buildQuery(filter: EmployeeDocumentsFilter): string {
  const sp = new URLSearchParams();
  if (filter.employeeId) {
    sp.set('employeeId', filter.employeeId);
  }
  if (filter.category) {
    sp.set('category', filter.category);
  }
  if (filter.documentTypes && filter.documentTypes.length > 0) {
    sp.set('documentTypes', filter.documentTypes.join(','));
  }
  if (filter.search) {
    sp.set('search', filter.search);
  }
  sp.set('page', String(filter.page ?? 1));
  sp.set('pageSize', String(filter.pageSize ?? 20));
  return `?${sp.toString()}`;
}

export interface CreateEmployeeDocumentPayload {
  employeeId?: string | null;
  category?: EmployeeDocumentCategory | null;
  documentType: EmployeeDocumentType;
  fileDate?: string | null;
  commentary?: string | null;
  expiryDate?: string | null;
  workplaceAccommodation?: string | null;
  permitNumber?: string | null;
  file: File;
}

export interface UpdateEmployeeDocumentPayload {
  category?: EmployeeDocumentCategory | null;
  documentType: EmployeeDocumentType;
  fileDate?: string | null;
  commentary?: string | null;
  expiryDate?: string | null;
  workplaceAccommodation?: string | null;
  permitNumber?: string | null;
  rowVersion?: string | null;
  file?: File | null;
}

function appendCommonFields(
  form: FormData,
  payload: Omit<CreateEmployeeDocumentPayload, 'file' | 'employeeId'>,
): void {
  if (payload.category) {
    form.append('category', payload.category);
  }
  form.append('documentType', payload.documentType);
  if (payload.fileDate) {
    form.append('fileDate', payload.fileDate);
  }
  if (payload.commentary) {
    form.append('commentary', payload.commentary);
  }
  if (payload.expiryDate) {
    form.append('expiryDate', payload.expiryDate);
  }
  if (payload.workplaceAccommodation) {
    form.append('workplaceAccommodation', payload.workplaceAccommodation);
  }
  if (payload.permitNumber) {
    form.append('permitNumber', payload.permitNumber);
  }
}

export const employeeDocumentsApi = {
  getDocuments: (filter: EmployeeDocumentsFilter): Promise<PagedResult<EmployeeDocumentDto>> =>
    httpClient.get<PagedResult<EmployeeDocumentDto>>(
      `/api/v1/employee-documents${buildQuery(filter)}`,
    ),

  downloadFile: (id: string, download = false): Promise<BlobDownloadResult> =>
    httpClient.getBlob(`/api/v1/employee-documents/${id}/file?download=${String(download)}`),

  createDocument: (payload: CreateEmployeeDocumentPayload): Promise<EmployeeDocumentDto> => {
    const form = new FormData();
    if (payload.employeeId) {
      form.append('employeeId', payload.employeeId);
    }
    appendCommonFields(form, payload);
    form.append('file', payload.file);
    return httpClient.post<EmployeeDocumentDto>('/api/v1/employee-documents', form);
  },

  updateDocument: (
    id: string,
    payload: UpdateEmployeeDocumentPayload,
  ): Promise<EmployeeDocumentDto> => {
    if (payload.file) {
      const form = new FormData();
      appendCommonFields(form, payload);
      if (payload.rowVersion) {
        form.append('rowVersion', payload.rowVersion);
      }
      form.append('file', payload.file);
      return httpClient.put<EmployeeDocumentDto>(`/api/v1/employee-documents/${id}`, form);
    }

    return httpClient.put<EmployeeDocumentDto>(`/api/v1/employee-documents/${id}`, {
      category: payload.category ?? null,
      documentType: payload.documentType,
      fileDate: payload.fileDate ?? null,
      commentary: payload.commentary ?? null,
      expiryDate: payload.expiryDate ?? null,
      workplaceAccommodation: payload.workplaceAccommodation ?? null,
      permitNumber: payload.permitNumber ?? null,
      rowVersion: payload.rowVersion ?? null,
    });
  },

  deleteDocument: (id: string): Promise<undefined> =>
    httpClient.delete<undefined>(`/api/v1/employee-documents/${id}`),
};
