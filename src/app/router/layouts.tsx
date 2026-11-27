import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authApi } from '@/features/auth';
import { useAuth } from '@/shared/auth/AuthContext';
import { tokenStore } from '@/shared/auth/tokenStore';
import { ConfirmDialog } from '@/shared/ui';
import { AppShell } from '../layout/AppShell';
import { AuthLayout } from '../layout/AuthLayout';
import { buildNavigationSections } from '../navigation';

export function AuthLayoutRoute() {
  return (
    <AuthLayout>
      <Outlet />
    </AuthLayout>
  );
}

export function ProtectedAppLayout() {
  const { user, clearSession } = useAuth();
  const navigate = useNavigate();
  const [logoutAllOpen, setLogoutAllOpen] = useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);

  if (!user) {
    return null;
  }

  const sections = buildNavigationSections(user.permissions, user.unreadNotificationsCount);

  const handleLogout = async () => {
    const refreshToken = tokenStore.getRefreshToken();
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } finally {
      clearSession(true);
      navigate('/login', { replace: true });
    }
  };

  const handleLogoutAll = async () => {
    setIsLoggingOutAll(true);
    try {
      await authApi.logoutAll();
      toast.success('Toutes vos sessions actives ont été déconnectées.');
    } finally {
      setIsLoggingOutAll(false);
      setLogoutAllOpen(false);
      clearSession(true);
      navigate('/login', { replace: true });
    }
  };

  return (
    <>
      <AppShell
        sections={sections}
        user={{
          email: user.email,
          roles: user.roles,
          unreadNotificationsCount: user.unreadNotificationsCount,
        }}
        onLogout={() => void handleLogout()}
        onLogoutAll={() => setLogoutAllOpen(true)}
      >
        <Outlet />
      </AppShell>
      <ConfirmDialog
        open={logoutAllOpen}
        onOpenChange={setLogoutAllOpen}
        title="Déconnecter tous les appareils ?"
        description="Toutes vos sessions actives seront révoquées immédiatement."
        confirmLabel="Tout déconnecter"
        variant="destructive"
        isLoading={isLoggingOutAll}
        onConfirm={() => void handleLogoutAll()}
      />
    </>
  );
}
