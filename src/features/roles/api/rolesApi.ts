import { httpClient } from '@/shared/api/httpClient';
import type {
  PermissionDto,
  RolePermissionsResponse,
  RoleSummaryDto,
  UpdateRolePermissionsRequest,
} from '../types/roleTypes';

export const rolesApi = {
  getRoles: () => httpClient.get<RoleSummaryDto[]>('/api/v1/roles'),
  getAllPermissions: () => httpClient.get<PermissionDto[]>('/api/v1/permissions'),
  getRolePermissions: (roleId: string) =>
    httpClient.get<RolePermissionsResponse>(`/api/v1/roles/${roleId}/permissions`),
  updateRolePermissions: (roleId: string, payload: UpdateRolePermissionsRequest) =>
    httpClient.put<RolePermissionsResponse>(`/api/v1/roles/${roleId}/permissions`, payload),
};
