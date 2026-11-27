import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, usePermission } from '@/shared/auth/AuthContext';
import { Spinner } from '@/shared/ui';

export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'initializing') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <Spinner label="Vérification de la session..." />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    const returnTo = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?from=${encodeURIComponent(returnTo)}`} replace />;
  }

  return <Outlet />;
}

export function GuestOnly() {
  const { status } = useAuth();

  if (status === 'initializing') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <Spinner label="Chargement..." />
      </div>
    );
  }

  if (status === 'authenticated') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export function RequirePermission({
  anyOf,
  children,
}: {
  anyOf: readonly string[];
  children: ReactNode;
}) {
  const { canAny } = usePermission();

  if (!canAny(anyOf)) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}
