export interface AuthTokens {
  accessToken: string;
  accessTokenExpiresAtUtc: string;
  refreshToken: string;
  refreshTokenExpiresAtUtc: string;
  tokenType: string;
}

export interface UserRoleSummary {
  id: string;
  code: string;
  name: string;
  priority: number;
}

export interface CurrentUserProfile {
  userId: string;
  employeeId: string | null;
  email: string;
  isActive: boolean;
  maxRolePriority: number;
  roles: UserRoleSummary[];
  permissions: string[];
  unreadNotificationsCount: number;
}
