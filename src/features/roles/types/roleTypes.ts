export interface PermissionDto {
  id: string;
  code: string;
  module: string;
  description: string;
}

export interface RoleSummaryDto {
  id: string;
  code: string;
  name: string;
  priority: number;
  description: string;
  permissionCount: number;
}

export interface RolePermissionsResponse {
  roleId: string;
  code: string;
  name: string;
  priority: number;
  permissions: PermissionDto[];
}

export interface UpdateRolePermissionsRequest {
  permissionCodes: string[];
}
