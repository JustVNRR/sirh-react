import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { renderAppAt } from '@/app/test/renderApp';
import { PERMISSIONS, ROLES } from '@/shared/auth/permissions';
import { tokenStore } from '@/shared/auth/tokenStore';
import { env } from '@/shared/config/env';
import { mswServer } from '@/shared/test/mswServer';

const api = (path: string) => `${env.apiBaseUrl}${path}`;

function mockAuthenticatedUser(
  roles: { id: string; code: string; name: string; priority: number }[],
  permissions: string[],
  unreadNotificationsCount = 0,
) {
  tokenStore.setTokens({ accessToken: 'valid-jwt', refreshToken: 'valid-refresh' });

  mswServer.use(
    http.post(api('/api/v1/auth/refresh'), () =>
      HttpResponse.json({
        accessToken: 'valid-jwt',
        accessTokenExpiresAtUtc: '2026-11-28T00:00:00Z',
        refreshToken: 'valid-refresh',
        refreshTokenExpiresAtUtc: '2026-12-05T00:00:00Z',
        tokenType: 'Bearer',
      }),
    ),
    http.get(api('/api/v1/auth/me'), () =>
      HttpResponse.json({
        userId: 'u-1',
        employeeId: 'e-1',
        email: 'user@nova-conseil.fr',
        isActive: true,
        maxRolePriority: roles[0]?.priority ?? 0,
        roles,
        permissions,
        unreadNotificationsCount,
      }),
    ),
  );
}

describe('RBAC Navigation & Dashboard integration', () => {
  it('hides unauthorized menu entries and blocks direct access with 403 for EMPLOYEE', async () => {
    mockAuthenticatedUser(
      [{ id: 'r-emp', code: ROLES.EMPLOYEE, name: 'Employe', priority: 2 }],
      [PERMISSIONS.EMPLOYEES_READ_SELF, PERMISSIONS.NOTIFICATIONS_READ_SELF],
      3,
    );

    renderAppAt(['/dashboard']);

    expect(await screen.findByRole('heading', { name: 'Tableau de bord' })).toBeInTheDocument();
    expect(screen.getByText('3 non lues')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Rôles & Permissions' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Collaborateurs' })).not.toBeInTheDocument();

    renderAppAt(['/admin/roles']);
    expect(await screen.findByText('403 — Accès refusé')).toBeInTheDocument();
  });

  it('shows HR and Admin sections for ADMIN user', async () => {
    mockAuthenticatedUser(
      [{ id: 'r-adm', code: ROLES.ADMIN, name: 'Admin', priority: 6 }],
      [
        PERMISSIONS.EMPLOYEES_READ_SELF,
        PERMISSIONS.EMPLOYEES_READ_ALL,
        PERMISSIONS.COMPANIES_READ,
        PERMISSIONS.ROLES_READ,
      ],
    );

    renderAppAt(['/dashboard']);

    expect(await screen.findByRole('heading', { name: 'Tableau de bord' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Collaborateurs' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Entreprises' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Rôles & Permissions' })).toBeInTheDocument();
  });

  it('shows restricted access banner for UNKNOWN role with no permissions', async () => {
    mockAuthenticatedUser([{ id: 'r-unk', code: ROLES.UNKNOWN, name: 'Inconnu', priority: 0 }], []);

    renderAppAt(['/dashboard']);

    expect(await screen.findByText('Accès restreint')).toBeInTheDocument();
  });
});
