import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { renderAppAt } from '@/app/test/renderApp';
import { PERMISSIONS, ROLES } from '@/shared/auth/permissions';
import { tokenStore } from '@/shared/auth/tokenStore';
import { env } from '@/shared/config/env';
import { mswServer } from '@/shared/test/mswServer';

const api = (path: string) => `${env.apiBaseUrl}${path}`;

function setupAuth(roleCode: string, permissions: string[]) {
  tokenStore.setTokens({ accessToken: 'jwt-1', refreshToken: 'ref-1' });
  mswServer.use(
    http.post(api('/api/v1/auth/refresh'), () =>
      HttpResponse.json({
        accessToken: 'jwt-1',
        accessTokenExpiresAtUtc: '2026-11-28T00:00:00Z',
        refreshToken: 'ref-1',
        refreshTokenExpiresAtUtc: '2026-12-05T00:00:00Z',
        tokenType: 'Bearer',
      }),
    ),
    http.get(api('/api/v1/auth/me'), () =>
      HttpResponse.json({
        userId: 'u-1',
        employeeId: 'e-1',
        email: 'admin@nova-conseil.fr',
        isActive: true,
        maxRolePriority: 6,
        roles: [{ id: 'r-admin', code: roleCode, name: roleCode, priority: 6 }],
        permissions,
        unreadNotificationsCount: 0,
      }),
    ),
    http.get(api('/api/v1/roles'), () =>
      HttpResponse.json([
        {
          id: 'r-emp',
          code: ROLES.EMPLOYEE,
          name: 'Employe',
          priority: 2,
          description: 'Standard employee',
          permissionCount: 1,
        },
        {
          id: 'r-sa',
          code: ROLES.SUPER_ADMIN,
          name: 'Super admin',
          priority: 7,
          description: 'Full access',
          permissionCount: 2,
        },
      ]),
    ),
    http.get(api('/api/v1/permissions'), () =>
      HttpResponse.json([
        {
          id: 'p-1',
          code: PERMISSIONS.EMPLOYEES_READ_SELF,
          module: 'HumanResources',
          description: 'Read own profile',
        },
        {
          id: 'p-2',
          code: PERMISSIONS.COMPANIES_READ,
          module: 'Organization',
          description: 'Read companies',
        },
      ]),
    ),
    http.get(api('/api/v1/roles/r-emp/permissions'), () =>
      HttpResponse.json({
        roleId: 'r-emp',
        code: ROLES.EMPLOYEE,
        name: 'Employe',
        priority: 2,
        permissions: [
          {
            id: 'p-1',
            code: PERMISSIONS.EMPLOYEES_READ_SELF,
            module: 'HumanResources',
            description: 'Read own profile',
          },
        ],
      }),
    ),
    http.get(api('/api/v1/roles/r-sa/permissions'), () =>
      HttpResponse.json({
        roleId: 'r-sa',
        code: ROLES.SUPER_ADMIN,
        name: 'Super admin',
        priority: 7,
        permissions: [
          {
            id: 'p-1',
            code: PERMISSIONS.EMPLOYEES_READ_SELF,
            module: 'HumanResources',
            description: 'Read own profile',
          },
          {
            id: 'p-2',
            code: PERMISSIONS.COMPANIES_READ,
            module: 'Organization',
            description: 'Read companies',
          },
        ],
      }),
    ),
  );
}

describe('Roles & Permissions Matrix (US-F012)', () => {
  it('allows ADMIN to update standard role permissions and locks SUPER_ADMIN', async () => {
    const user = userEvent.setup();
    let capturedCodes: string[] = [];

    setupAuth(ROLES.ADMIN, [PERMISSIONS.ROLES_READ, PERMISSIONS.ROLES_MANAGE_PERMISSIONS]);
    mswServer.use(
      http.put(api('/api/v1/roles/r-emp/permissions'), async ({ request }) => {
        const body = (await request.json()) as { permissionCodes: string[] };
        capturedCodes = body.permissionCodes;
        return HttpResponse.json({
          roleId: 'r-emp',
          code: ROLES.EMPLOYEE,
          name: 'Employe',
          priority: 2,
          permissions: [],
        });
      }),
    );

    renderAppAt(['/admin/roles']);

    expect(await screen.findByText('Ressources Humaines')).toBeInTheDocument();
    const companiesCheckbox = screen.getByLabelText(PERMISSIONS.COMPANIES_READ);
    expect(companiesCheckbox).not.toBeChecked();

    await user.click(companiesCheckbox);
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() => {
      expect(capturedCodes).toContain(PERMISSIONS.COMPANIES_READ);
    });

    await user.click(screen.getByRole('button', { name: /Super admin/i }));
    expect(await screen.findByText(/Rôle protégé/i)).toBeInTheDocument();
    expect(screen.getByLabelText(PERMISSIONS.COMPANIES_READ)).toBeDisabled();
  });

  it('renders read-only mode when user only has roles:read', async () => {
    setupAuth(ROLES.HR, [PERMISSIONS.ROLES_READ]);

    renderAppAt(['/admin/roles']);

    expect(await screen.findByText(/Mode lecture seule/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Enregistrer' })).not.toBeInTheDocument();
    expect(await screen.findByLabelText(PERMISSIONS.COMPANIES_READ)).toBeDisabled();
  });
});
