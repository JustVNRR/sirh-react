import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/shared/auth/AuthContext';
import { rolesApi } from '../api/rolesApi';
import type { UpdateRolePermissionsRequest } from '../types/roleTypes';

export const rolesKeys = {
  all: ['roles'] as const,
  list: () => [...rolesKeys.all, 'list'] as const,
  permissions: () => [...rolesKeys.all, 'permissions'] as const,
  detail: (roleId: string) => [...rolesKeys.all, 'detail', roleId] as const,
};

export function useRolesListQuery() {
  return useQuery({
    queryKey: rolesKeys.list(),
    queryFn: () => rolesApi.getRoles(),
  });
}

export function useAllPermissionsQuery() {
  return useQuery({
    queryKey: rolesKeys.permissions(),
    queryFn: () => rolesApi.getAllPermissions(),
    staleTime: 10 * 60_000,
  });
}

export function useRolePermissionsQuery(roleId: string | null) {
  return useQuery({
    queryKey: rolesKeys.detail(roleId ?? 'none'),
    queryFn: () => {
      if (!roleId) {
        throw new Error('Role ID required');
      }
      return rolesApi.getRolePermissions(roleId);
    },
    enabled: Boolean(roleId),
  });
}

export function useUpdateRolePermissionsMutation() {
  const qc = useQueryClient();
  const { user, refreshProfile } = useAuth();

  return useMutation({
    mutationFn: ({ roleId, payload }: { roleId: string; payload: UpdateRolePermissionsRequest }) =>
      rolesApi.updateRolePermissions(roleId, payload),
    onSuccess: async (updated) => {
      await qc.invalidateQueries({ queryKey: rolesKeys.all });
      const affectsCurrentUser = user?.roles.some((r) => r.id === updated.roleId);
      if (affectsCurrentUser) {
        await refreshProfile();
      }
    },
  });
}
