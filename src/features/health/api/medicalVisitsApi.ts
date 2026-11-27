import { httpClient, type BlobDownloadResult } from '@/shared/api/httpClient';
import type { PagedResult } from '@/shared/api/types';
import type {
  MedicalVisitDto,
  MedicalVisitType,
  MedicalVisitsFilter,
} from '../types/medicalVisitTypes';

function buildQuery(filter: MedicalVisitsFilter): string {
  const sp = new URLSearchParams();
  if (filter.employeeId) {
    sp.set('employeeId', filter.employeeId);
  }
  if (filter.visitType) {
    sp.set('visitType', filter.visitType);
  }
  if (filter.fromDate) {
    sp.set('fromDate', filter.fromDate);
  }
  if (filter.toDate) {
    sp.set('toDate', filter.toDate);
  }
  if (filter.carriedOut !== undefined) {
    sp.set('carriedOut', String(filter.carriedOut));
  }
  sp.set('page', String(filter.page ?? 1));
  sp.set('pageSize', String(filter.pageSize ?? 20));
  return `?${sp.toString()}`;
}

export interface CreateMedicalVisitPayload {
  employeeId: string;
  visitType: MedicalVisitType;
  visitDateTimeUtc: string;
  validityDate?: string | null;
  medicalCenter?: string | null;
  carriedOut: boolean;
  comments?: string | null;
  convocationFile: File;
  reportFile?: File | null;
}

export interface UpdateMedicalVisitPayload {
  visitType: MedicalVisitType;
  visitDateTimeUtc: string;
  validityDate?: string | null;
  medicalCenter?: string | null;
  carriedOut: boolean;
  comments?: string | null;
  rowVersion?: string | null;
  convocationFile?: File | null;
  reportFile?: File | null;
}

export const medicalVisitsApi = {
  getVisits: (filter: MedicalVisitsFilter): Promise<PagedResult<MedicalVisitDto>> =>
    httpClient.get<PagedResult<MedicalVisitDto>>(`/api/v1/medical-visits${buildQuery(filter)}`),

  downloadConvocationFile: (id: string, download = false): Promise<BlobDownloadResult> =>
    httpClient.getBlob(
      `/api/v1/medical-visits/${id}/convocation-file?download=${String(download)}`,
    ),

  downloadReportFile: (id: string, download = false): Promise<BlobDownloadResult> =>
    httpClient.getBlob(`/api/v1/medical-visits/${id}/report-file?download=${String(download)}`),

  createVisit: (payload: CreateMedicalVisitPayload): Promise<MedicalVisitDto> => {
    const form = new FormData();
    form.append('employeeId', payload.employeeId);
    form.append('visitType', payload.visitType);
    form.append('visitDateTimeUtc', payload.visitDateTimeUtc);
    if (payload.validityDate) {
      form.append('validityDate', payload.validityDate);
    }
    if (payload.medicalCenter) {
      form.append('medicalCenter', payload.medicalCenter);
    }
    form.append('carriedOut', String(payload.carriedOut));
    if (payload.comments) {
      form.append('comments', payload.comments);
    }
    form.append('convocationFile', payload.convocationFile);
    if (payload.reportFile) {
      form.append('reportFile', payload.reportFile);
    }
    return httpClient.post<MedicalVisitDto>('/api/v1/medical-visits', form);
  },

  updateVisit: (id: string, payload: UpdateMedicalVisitPayload): Promise<MedicalVisitDto> => {
    if (payload.convocationFile || payload.reportFile) {
      const form = new FormData();
      form.append('visitType', payload.visitType);
      form.append('visitDateTimeUtc', payload.visitDateTimeUtc);
      if (payload.validityDate) {
        form.append('validityDate', payload.validityDate);
      }
      if (payload.medicalCenter) {
        form.append('medicalCenter', payload.medicalCenter);
      }
      form.append('carriedOut', String(payload.carriedOut));
      if (payload.comments) {
        form.append('comments', payload.comments);
      }
      if (payload.rowVersion) {
        form.append('rowVersion', payload.rowVersion);
      }
      if (payload.convocationFile) {
        form.append('convocationFile', payload.convocationFile);
      }
      if (payload.reportFile) {
        form.append('reportFile', payload.reportFile);
      }
      return httpClient.put<MedicalVisitDto>(`/api/v1/medical-visits/${id}`, form);
    }

    return httpClient.put<MedicalVisitDto>(`/api/v1/medical-visits/${id}`, {
      visitType: payload.visitType,
      visitDateTimeUtc: payload.visitDateTimeUtc,
      validityDate: payload.validityDate ?? null,
      medicalCenter: payload.medicalCenter ?? null,
      carriedOut: payload.carriedOut,
      comments: payload.comments ?? null,
      rowVersion: payload.rowVersion ?? null,
    });
  },

  deleteVisit: (id: string): Promise<undefined> =>
    httpClient.delete<undefined>(`/api/v1/medical-visits/${id}`),
};
