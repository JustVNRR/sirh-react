import { httpClient } from '@/shared/api/httpClient';
import type {
  CreateEmergencyContactRequest,
  EmergencyContactDto,
  UpdateEmergencyContactRequest,
} from '../types/employeeTypes';

export const emergencyContactsApi = {
  getByEmployeeId: (employeeId: string) =>
    httpClient.get<EmergencyContactDto[]>(`/api/v1/employees/${employeeId}/emergency-contacts`),

  create: (employeeId: string, payload: CreateEmergencyContactRequest) =>
    httpClient.post<EmergencyContactDto>(
      `/api/v1/employees/${employeeId}/emergency-contacts`,
      payload,
    ),

  update: (id: string, payload: UpdateEmergencyContactRequest) =>
    httpClient.put<EmergencyContactDto>(`/api/v1/emergency-contacts/${id}`, payload),

  delete: (id: string) => httpClient.delete<undefined>(`/api/v1/emergency-contacts/${id}`),
};
