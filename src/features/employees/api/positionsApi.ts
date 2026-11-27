import { httpClient } from '@/shared/api/httpClient';
import type {
  CreatePositionRequest,
  PositionDto,
  UpdatePositionRequest,
} from '../types/employeeTypes';

export const positionsApi = {
  getByEmployeeId: (employeeId: string) =>
    httpClient.get<PositionDto[]>(`/api/v1/employees/${employeeId}/positions`),

  create: (payload: CreatePositionRequest) =>
    httpClient.post<PositionDto>('/api/v1/positions', payload),

  update: (id: string, payload: UpdatePositionRequest) =>
    httpClient.put<PositionDto>(`/api/v1/positions/${id}`, payload),

  delete: (id: string) => httpClient.delete<undefined>(`/api/v1/positions/${id}`),
};
