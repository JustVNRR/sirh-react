export const ROLES = {
  UNKNOWN: 'UNKNOWN',
  APPRENTICE: 'APPRENTICE',
  EMPLOYEE: 'EMPLOYEE',
  MANAGER: 'MANAGER',
  CSE: 'CSE',
  HR: 'HR',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;

export type RoleCode = (typeof ROLES)[keyof typeof ROLES];

export const PERMISSIONS = {
  ROLES_READ: 'roles:read',
  ROLES_MANAGE_PERMISSIONS: 'roles:manage-permissions',

  COMPANIES_READ: 'companies:read',
  COMPANIES_WRITE: 'companies:write',
  LOCATIONS_READ: 'locations:read',
  LOCATIONS_WRITE: 'locations:write',
  CONTRACT_TYPES_READ: 'contract-types:read',
  CONTRACT_TYPES_WRITE: 'contract-types:write',

  EMPLOYEES_READ_SELF: 'employees:read:self',
  EMPLOYEES_READ_TEAM: 'employees:read:team',
  EMPLOYEES_READ_ALL: 'employees:read:all',
  EMPLOYEES_WRITE: 'employees:write',
  EMPLOYEES_MANAGE_PRIVILEGED: 'employees:manage-privileged',

  POSITIONS_READ_SELF: 'positions:read:self',
  POSITIONS_READ_TEAM: 'positions:read:team',
  POSITIONS_READ_ALL: 'positions:read:all',
  POSITIONS_WRITE: 'positions:write',

  EMERGENCY_CONTACTS_READ_SELF: 'emergency-contacts:read:self',
  EMERGENCY_CONTACTS_READ_ALL: 'emergency-contacts:read:all',
  EMERGENCY_CONTACTS_WRITE_SELF: 'emergency-contacts:write:self',
  EMERGENCY_CONTACTS_WRITE_ALL: 'emergency-contacts:write:all',

  CONTRACT_MODELS_READ: 'contract-models:read',
  CONTRACT_MODELS_WRITE: 'contract-models:write',
  CONTRACTS_READ_SELF: 'contracts:read:self',
  CONTRACTS_READ_ALL: 'contracts:read:all',
  CONTRACTS_WRITE: 'contracts:write',
  JOBSHEETS_READ_SELF: 'jobsheets:read:self',
  JOBSHEETS_READ_TEAM: 'jobsheets:read:team',
  JOBSHEETS_READ_ALL: 'jobsheets:read:all',
  JOBSHEETS_WRITE: 'jobsheets:write',

  EMPLOYEE_DOCS_READ_SELF: 'employee-docs:read:self',
  EMPLOYEE_DOCS_READ_TEAM: 'employee-docs:read:team',
  EMPLOYEE_DOCS_READ_ALL: 'employee-docs:read:all',
  EMPLOYEE_DOCS_READ_SENSITIVE: 'employee-docs:read:sensitive',
  EMPLOYEE_DOCS_WRITE_SELF: 'employee-docs:write:self',
  EMPLOYEE_DOCS_WRITE_ALL: 'employee-docs:write:all',

  MEDICAL_VISITS_READ_SELF: 'medical-visits:read:self',
  MEDICAL_VISITS_READ_ALL: 'medical-visits:read:all',
  MEDICAL_VISITS_WRITE: 'medical-visits:write',
  NOTIFICATIONS_READ_SELF: 'notifications:read:self',
  NOTIFICATIONS_WRITE_SELF: 'notifications:write:self',

  COMMON_DOCS_READ: 'common-docs:read',
  COMMON_DOCS_WRITE: 'common-docs:write',
  COMMON_DOCS_WRITE_CSE: 'common-docs:write:cse',
  WELCOME_KITS_READ: 'welcome-kits:read',
  WELCOME_KITS_WRITE: 'welcome-kits:write',
  STAFF_REPS_READ: 'staff-reps:read',
  STAFF_REPS_WRITE: 'staff-reps:write',
  RSE_READ_SELF: 'rse:read:self',
  RSE_READ_ALL: 'rse:read:all',
  RSE_WRITE: 'rse:write',
  RSE_TREAT: 'rse:treat',
  QUIZZES_READ: 'quizzes:read',
  QUIZZES_WRITE: 'quizzes:write',
  QUIZZES_TAKE: 'quizzes:take',
  QUIZZES_RESULTS_ALL: 'quizzes:results:all',
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export function hasPermission(userPermissions: readonly string[], permission: string): boolean {
  return userPermissions.includes(permission);
}

export function hasAnyPermission(
  userPermissions: readonly string[],
  requiredPermissions: readonly string[],
): boolean {
  if (requiredPermissions.length === 0) {
    return true;
  }
  return requiredPermissions.some((permission) => userPermissions.includes(permission));
}

export function hasAllPermissions(
  userPermissions: readonly string[],
  requiredPermissions: readonly string[],
): boolean {
  return requiredPermissions.every((permission) => userPermissions.includes(permission));
}

export function hasRole(userRoles: readonly { code: string }[], roleCode: string): boolean {
  return userRoles.some((r) => r.code.toUpperCase() === roleCode.toUpperCase());
}
