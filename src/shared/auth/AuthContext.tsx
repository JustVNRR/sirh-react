import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { httpClient, refreshAccessTokenSingleFlight } from '@/shared/api/httpClient';
import { hasAllPermissions, hasAnyPermission, hasPermission } from './permissions';
import { tokenStore } from './tokenStore';
import type { AuthTokens, CurrentUserProfile } from './types';

export type AuthStatus = 'initializing' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  user: CurrentUserProfile | null;
  setAuthenticatedSession: (tokens: AuthTokens) => Promise<CurrentUserProfile>;
  refreshProfile: () => Promise<CurrentUserProfile | null>;
  clearSession: (broadcast?: boolean) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('initializing');
  const [user, setUser] = useState<CurrentUserProfile | null>(null);

  const clearSession = useCallback((broadcast = false) => {
    tokenStore.clearTokens(broadcast);
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const refreshProfile = useCallback(async (): Promise<CurrentUserProfile | null> => {
    try {
      const profile = await httpClient.get<CurrentUserProfile>('/api/v1/auth/me');
      setUser(profile);
      setStatus('authenticated');
      return profile;
    } catch {
      clearSession(false);
      return null;
    }
  }, [clearSession]);

  const setAuthenticatedSession = useCallback(
    async (tokens: AuthTokens): Promise<CurrentUserProfile> => {
      tokenStore.setTokens(tokens);
      const profile = await httpClient.get<CurrentUserProfile>('/api/v1/auth/me');
      setUser(profile);
      setStatus('authenticated');
      return profile;
    },
    [],
  );

  useEffect(() => {
    const unsubscribe = tokenStore.subscribeToLogout(() => {
      setUser(null);
      setStatus('unauthenticated');
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    let active = true;

    async function hydrate() {
      const refreshToken = tokenStore.getRefreshToken();
      if (!refreshToken) {
        if (active) {
          setStatus('unauthenticated');
        }
        return;
      }

      const accessToken = await refreshAccessTokenSingleFlight();
      if (!active) {
        return;
      }

      if (!accessToken) {
        clearSession(false);
        return;
      }

      await refreshProfile();
    }

    void hydrate();

    return () => {
      active = false;
    };
  }, [clearSession, refreshProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      setAuthenticatedSession,
      refreshProfile,
      clearSession,
    }),
    [status, user, setAuthenticatedSession, refreshProfile, clearSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePermission() {
  const { user } = useAuth();
  const permissions = useMemo(() => user?.permissions ?? [], [user?.permissions]);

  return useMemo(
    () => ({
      permissions,
      can: (permission: string) => hasPermission(permissions, permission),
      canAny: (required: readonly string[]) => hasAnyPermission(permissions, required),
      canAll: (required: readonly string[]) => hasAllPermissions(permissions, required),
    }),
    [permissions],
  );
}

export interface PermissionGateProps {
  anyOf?: readonly string[];
  allOf?: readonly string[];
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGate({ anyOf, allOf, fallback = null, children }: PermissionGateProps) {
  const { canAny, canAll } = usePermission();

  const allowedByAny = anyOf ? canAny(anyOf) : true;
  const allowedByAll = allOf ? canAll(allOf) : true;

  if (!allowedByAny || !allowedByAll) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
