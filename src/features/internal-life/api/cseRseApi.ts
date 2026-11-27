import { httpClient, type BlobDownloadResult } from '@/shared/api/httpClient';
import type { PagedResult } from '@/shared/api/types';
import type {
  CreateStaffRepresentativeRequest,
  RseIdeaDto,
  RseIdeasFilter,
  StaffRepresentativeDto,
  StaffRepresentativesFilter,
  TreatRseIdeaRequest,
  UpdateStaffRepresentativeRequest,
} from '../types/cseRseTypes';

function buildStaffQuery(filter: StaffRepresentativesFilter): string {
  const sp = new URLSearchParams();
  if (filter.companyId) {
    sp.set('companyId', filter.companyId);
  }
  if (filter.role) {
    sp.set('role', filter.role);
  }
  if (filter.harassmentAdvisor !== undefined) {
    sp.set('harassmentAdvisor', String(filter.harassmentAdvisor));
  }
  if (filter.search) {
    sp.set('search', filter.search);
  }
  sp.set('page', String(filter.page ?? 1));
  sp.set('pageSize', String(filter.pageSize ?? 20));
  return `?${sp.toString()}`;
}

function buildRseQuery(filter: RseIdeasFilter): string {
  const sp = new URLSearchParams();
  if (filter.locationId) {
    sp.set('locationId', filter.locationId);
  }
  if (filter.status) {
    sp.set('status', filter.status);
  }
  if (filter.authorId) {
    sp.set('authorId', filter.authorId);
  }
  if (filter.mineOnly !== undefined) {
    sp.set('mineOnly', String(filter.mineOnly));
  }
  if (filter.search) {
    sp.set('search', filter.search);
  }
  sp.set('page', String(filter.page ?? 1));
  sp.set('pageSize', String(filter.pageSize ?? 20));
  return `?${sp.toString()}`;
}

export interface CreateRseIdeaPayload {
  locationId?: string | null;
  title: string;
  ideaContent: string;
  file?: File | null;
}

export interface UpdateRseIdeaPayload extends CreateRseIdeaPayload {
  rowVersion?: string | null;
}

export const staffRepresentativesApi = {
  getPaged: (filter: StaffRepresentativesFilter): Promise<PagedResult<StaffRepresentativeDto>> =>
    httpClient.get<PagedResult<StaffRepresentativeDto>>(
      `/api/v1/staff-representatives${buildStaffQuery(filter)}`,
    ),

  create: (payload: CreateStaffRepresentativeRequest): Promise<StaffRepresentativeDto> =>
    httpClient.post<StaffRepresentativeDto>('/api/v1/staff-representatives', payload),

  update: (
    id: string,
    payload: UpdateStaffRepresentativeRequest,
  ): Promise<StaffRepresentativeDto> =>
    httpClient.put<StaffRepresentativeDto>(`/api/v1/staff-representatives/${id}`, payload),

  delete: (id: string): Promise<undefined> =>
    httpClient.delete<undefined>(`/api/v1/staff-representatives/${id}`),
};

export const rseIdeasApi = {
  getPaged: (filter: RseIdeasFilter): Promise<PagedResult<RseIdeaDto>> =>
    httpClient.get<PagedResult<RseIdeaDto>>(`/api/v1/rse-ideas${buildRseQuery(filter)}`),

  downloadAttachment: (id: string, download = false): Promise<BlobDownloadResult> =>
    httpClient.getBlob(`/api/v1/rse-ideas/${id}/file?download=${String(download)}`),

  create: (payload: CreateRseIdeaPayload): Promise<RseIdeaDto> => {
    if (payload.file) {
      const form = new FormData();
      if (payload.locationId) {
        form.append('locationId', payload.locationId);
      }
      form.append('title', payload.title);
      form.append('ideaContent', payload.ideaContent);
      form.append('file', payload.file);
      return httpClient.post<RseIdeaDto>('/api/v1/rse-ideas', form);
    }

    return httpClient.post<RseIdeaDto>('/api/v1/rse-ideas', {
      locationId: payload.locationId ?? null,
      title: payload.title,
      ideaContent: payload.ideaContent,
    });
  },

  update: (id: string, payload: UpdateRseIdeaPayload): Promise<RseIdeaDto> => {
    if (payload.file) {
      const form = new FormData();
      if (payload.locationId) {
        form.append('locationId', payload.locationId);
      }
      form.append('title', payload.title);
      form.append('ideaContent', payload.ideaContent);
      if (payload.rowVersion) {
        form.append('rowVersion', payload.rowVersion);
      }
      form.append('file', payload.file);
      return httpClient.put<RseIdeaDto>(`/api/v1/rse-ideas/${id}`, form);
    }

    return httpClient.put<RseIdeaDto>(`/api/v1/rse-ideas/${id}`, {
      locationId: payload.locationId ?? null,
      title: payload.title,
      ideaContent: payload.ideaContent,
      rowVersion: payload.rowVersion ?? null,
    });
  },

  treat: (id: string, payload: TreatRseIdeaRequest): Promise<RseIdeaDto> =>
    httpClient.patch<RseIdeaDto>(`/api/v1/rse-ideas/${id}/status`, payload),

  delete: (id: string): Promise<undefined> =>
    httpClient.delete<undefined>(`/api/v1/rse-ideas/${id}`),
};
