import { Lock, RotateCcw, Save, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ApiError } from '@/shared/api/types';
import { useAuth, usePermission } from '@/shared/auth/AuthContext';
import { PERMISSIONS, ROLES, hasRole } from '@/shared/auth/permissions';
import { cn } from '@/shared/lib/cn';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  PageHeader,
  Spinner,
} from '@/shared/ui';
import {
  useAllPermissionsQuery,
  useRolePermissionsQuery,
  useRolesListQuery,
  useUpdateRolePermissionsMutation,
} from '../hooks/useRolesQueries';
import type { PermissionDto } from '../types/roleTypes';

const MODULE_LABELS: Record<string, string> = {
  Identity: 'Identité & Accès',
  Organization: 'Organisation & Référentiels',
  HumanResources: 'Ressources Humaines',
  Contracts: 'Contrats & Fiches de poste',
  Health: 'Santé & Notifications',
  InternalLife: 'Vie Interne & QCM',
};

function groupPermissionsByModule(
  permissions: readonly PermissionDto[],
): [string, PermissionDto[]][] {
  const map = new Map<string, PermissionDto[]>();
  for (const permission of permissions) {
    const existing = map.get(permission.module) ?? [];
    existing.push(permission);
    map.set(permission.module, existing);
  }
  return Array.from(map.entries());
}

export function RolesPermissionsPage() {
  const { user } = useAuth();
  const { can } = usePermission();
  const canManage = can(PERMISSIONS.ROLES_MANAGE_PERMISSIONS);
  const isSuperAdmin = hasRole(user?.roles ?? [], ROLES.SUPER_ADMIN);

  const rolesQuery = useRolesListQuery();
  const allPermissionsQuery = useAllPermissionsQuery();
  const updateMutation = useUpdateRolePermissionsMutation();

  const sortedRoles = useMemo(
    () => [...(rolesQuery.data ?? [])].sort((a, b) => a.priority - b.priority),
    [rolesQuery.data],
  );

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const effectiveRoleId = selectedRoleId ?? sortedRoles[0]?.id ?? null;

  const roleDetailQuery = useRolePermissionsQuery(effectiveRoleId);
  const [draftState, setDraftState] = useState<{ roleKey: string; codes: Set<string> } | null>(
    null,
  );
  const [saveError, setSaveError] = useState<string | null>(null);

  const initialCodes = useMemo(
    () => new Set(roleDetailQuery.data?.permissions.map((p) => p.code) ?? []),
    [roleDetailQuery.data],
  );

  const currentRoleKey = roleDetailQuery.data
    ? `${roleDetailQuery.data.roleId}:${[...roleDetailQuery.data.permissions.map((p) => p.code)].sort().join(',')}`
    : '';

  const draftCodes =
    draftState && draftState.roleKey === currentRoleKey ? draftState.codes : initialCodes;

  const isDirty = useMemo(() => {
    if (draftCodes.size !== initialCodes.size) {
      return true;
    }
    for (const code of draftCodes) {
      if (!initialCodes.has(code)) {
        return true;
      }
    }
    return false;
  }, [draftCodes, initialCodes]);

  const isSuperAdminTarget = roleDetailQuery.data?.code === ROLES.SUPER_ADMIN;
  const isProtectedSuperAdmin = isSuperAdminTarget && !isSuperAdmin;
  const isReadOnly = !canManage || isProtectedSuperAdmin;

  const groupedPermissions = useMemo(
    () => groupPermissionsByModule(allPermissionsQuery.data ?? []),
    [allPermissionsQuery.data],
  );

  const togglePermission = (code: string) => {
    if (isReadOnly) {
      return;
    }
    const next = new Set(draftCodes);
    if (next.has(code)) {
      next.delete(code);
    } else {
      next.add(code);
    }
    setDraftState({ roleKey: currentRoleKey, codes: next });
  };

  const toggleModuleAll = (perms: readonly PermissionDto[]) => {
    if (isReadOnly) {
      return;
    }
    const allChecked = perms.every((p) => draftCodes.has(p.code));
    const next = new Set(draftCodes);
    for (const perm of perms) {
      if (allChecked) {
        next.delete(perm.code);
      } else {
        next.add(perm.code);
      }
    }
    setDraftState({ roleKey: currentRoleKey, codes: next });
  };

  const handleSave = async () => {
    if (!effectiveRoleId || isReadOnly) {
      return;
    }
    setSaveError(null);
    try {
      await updateMutation.mutateAsync({
        roleId: effectiveRoleId,
        payload: { permissionCodes: Array.from(draftCodes) },
      });
      setDraftState(null);
      toast.success(`Permissions du rôle ${roleDetailQuery.data?.name ?? ''} mises à jour.`);
    } catch (error) {
      setSaveError(
        error instanceof ApiError ? error.detail : 'Impossible de mettre à jour les permissions.',
      );
    }
  };

  if (rolesQuery.isLoading || allPermissionsQuery.isLoading) {
    return <Spinner label="Chargement de la matrice des rôles..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rôles & Permissions"
        description="Gouvernez les permissions métier attribuées à chaque rôle système."
        actions={
          !isReadOnly && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                disabled={!isDirty || updateMutation.isPending}
                onClick={() => {
                  setDraftState(null);
                  setSaveError(null);
                }}
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Réinitialiser
              </Button>
              <Button
                disabled={!isDirty}
                isLoading={updateMutation.isPending}
                onClick={() => void handleSave()}
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                Enregistrer
              </Button>
            </div>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Rôles ({sortedRoles.length})</CardTitle>
            <CardDescription>Sélectionnez un rôle pour afficher ses droits.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {sortedRoles.map((role) => {
              const selected = role.id === effectiveRoleId;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => {
                    setSelectedRoleId(role.id);
                    setDraftState(null);
                    setSaveError(null);
                  }}
                  className={cn(
                    'flex w-full cursor-pointer items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors',
                    selected
                      ? 'border-[var(--primary)] bg-indigo-50/60 dark:bg-indigo-950/30'
                      : 'border-[var(--border)] hover:bg-[var(--surface-muted)]',
                  )}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--foreground)]">{role.name}</p>
                    <p className="truncate text-xs text-[var(--muted-foreground)]">
                      <span className="font-mono">{role.code}</span> · Priorité {role.priority}
                    </p>
                  </div>
                  <Badge variant={selected ? 'primary' : 'neutral'}>{role.permissionCount}</Badge>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-4 lg:col-span-8">
          {isProtectedSuperAdmin && (
            <Alert variant="warning" title="Rôle protégé">
              Seul un utilisateur disposant du rôle SUPER_ADMIN peut modifier les permissions du
              rôle Super Administrateur.
            </Alert>
          )}
          {!canManage && (
            <Alert variant="info" title="Mode lecture seule">
              Vous disposez de la permission de consultation uniquement (roles:read).
            </Alert>
          )}
          {saveError && (
            <Alert variant="danger" title="Erreur d'enregistrement">
              {saveError}
            </Alert>
          )}

          {roleDetailQuery.isLoading ? (
            <Spinner label="Chargement des permissions du rôle..." />
          ) : (
            <div className="space-y-4">
              {groupedPermissions.map(([moduleName, perms]) => {
                const allChecked = perms.every((p) => draftCodes.has(p.code));
                return (
                  <Card key={moduleName}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-base">
                          {isReadOnly ? (
                            <Lock
                              className="h-4 w-4 text-[var(--muted-foreground)]"
                              aria-hidden="true"
                            />
                          ) : (
                            <ShieldCheck
                              className="h-4 w-4 text-[var(--primary)]"
                              aria-hidden="true"
                            />
                          )}
                          {MODULE_LABELS[moduleName] ?? moduleName}
                        </CardTitle>
                        <CardDescription>
                          {perms.filter((p) => draftCodes.has(p.code)).length} / {perms.length}{' '}
                          activées
                        </CardDescription>
                      </div>
                      {!isReadOnly && (
                        <Button variant="outline" size="sm" onClick={() => toggleModuleAll(perms)}>
                          {allChecked ? 'Tout décocher' : 'Tout cocher'}
                        </Button>
                      )}
                    </CardHeader>
                    <CardContent className="grid gap-2.5 sm:grid-cols-2">
                      {perms.map((perm) => (
                        <div
                          key={perm.id}
                          className="rounded-lg border border-[var(--border)] p-2.5"
                        >
                          <Checkbox
                            id={`perm-${perm.code}`}
                            checked={draftCodes.has(perm.code)}
                            disabled={isReadOnly}
                            onChange={() => togglePermission(perm.code)}
                            label={perm.code}
                          />
                          <p className="mt-1 pl-6 text-xs text-[var(--muted-foreground)]">
                            {perm.description}
                          </p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
