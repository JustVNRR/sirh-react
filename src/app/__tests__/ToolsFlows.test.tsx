import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { renderAppAt } from '@/app/test/renderApp';
import { PERMISSIONS, ROLES } from '@/shared/auth/permissions';
import { tokenStore } from '@/shared/auth/tokenStore';
import { env } from '@/shared/config/env';
import { mswServer } from '@/shared/test/mswServer';

const api = (path: string) => `${env.apiBaseUrl}${path}`;

describe('ToolsFlows (URSSAF & eDocPerso)', () => {
  it('renders URSSAF simulator iframe, fallback external link, and secure eDocPerso link', async () => {
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
          email: 'user@nova-conseil.fr',
          isActive: true,
          maxRolePriority: 2,
          roles: [{ id: 'r-1', code: ROLES.EMPLOYEE, name: 'Employe', priority: 2 }],
          permissions: [PERMISSIONS.EMPLOYEES_READ_SELF],
          unreadNotificationsCount: 0,
        }),
      ),
    );

    renderAppAt(['/tools/urssaf-estimator']);

    expect(await screen.findByTitle('Simulateur de cotisations URSSAF')).toBeInTheDocument();

    const fallbackLink = screen.getByRole('link', { name: /Ouvrir dans un onglet/i });
    expect(fallbackLink).toHaveAttribute('target', '_blank');
    expect(fallbackLink).toHaveAttribute('rel', 'noopener noreferrer');

    const edocLink = screen.getByRole('link', { name: /Accéder à eDocPerso/i });
    expect(edocLink).toHaveAttribute('href', env.edocPersoUrl);
    expect(edocLink).toHaveAttribute('target', '_blank');
    expect(edocLink).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
