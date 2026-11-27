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

describe('LoginPage integration', () => {
  it('logs in, stores accessToken in memory and refreshToken in sessionStorage, and redirects to /dashboard', async () => {
    const user = userEvent.setup();

    mswServer.use(
      http.post(api('/api/v1/auth/login'), () =>
        HttpResponse.json({
          accessToken: 'jwt-access-123',
          accessTokenExpiresAtUtc: '2026-11-28T00:00:00Z',
          refreshToken: 'opaque-refresh-456',
          refreshTokenExpiresAtUtc: '2026-12-05T00:00:00Z',
          tokenType: 'Bearer',
        }),
      ),
      http.get(api('/api/v1/auth/me'), () =>
        HttpResponse.json({
          userId: 'u-1',
          employeeId: 'e-1',
          email: 'employe.rh@nova-conseil.fr',
          isActive: true,
          maxRolePriority: 2,
          roles: [{ id: 'r-1', code: ROLES.EMPLOYEE, name: 'Employe', priority: 2 }],
          permissions: [PERMISSIONS.EMPLOYEES_READ_SELF],
          unreadNotificationsCount: 0,
        }),
      ),
    );

    renderAppAt(['/login']);

    await user.type(
      await screen.findByLabelText(/Email professionnel/i),
      'employe.rh@nova-conseil.fr',
    );
    await user.type(screen.getByLabelText(/^Mot de passe/i), 'SirhDemo123!');
    await user.click(screen.getByRole('button', { name: 'Se connecter' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Tableau de bord' })).toBeInTheDocument();
    });

    expect(tokenStore.getAccessToken()).toBe('jwt-access-123');
    expect(window.sessionStorage.getItem('sirh.refresh_token')).toBe('opaque-refresh-456');
    expect(window.localStorage.getItem('sirh.refresh_token')).toBeNull();
  });

  it('displays clear messages for 401, 423 Locked, and 429 Too Many Requests', async () => {
    const user = userEvent.setup();

    mswServer.use(
      http.post(api('/api/v1/auth/login'), () =>
        HttpResponse.json({ status: 401, title: 'Auth.InvalidCredentials' }, { status: 401 }),
      ),
    );

    renderAppAt(['/login']);
    await user.type(await screen.findByLabelText(/Email professionnel/i), 'test@nova-conseil.fr');
    await user.type(screen.getByLabelText(/^Mot de passe/i), 'WrongPass1!');
    await user.click(screen.getByRole('button', { name: 'Se connecter' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Identifiants invalides ou compte désactivé.',
    );

    mswServer.use(
      http.post(api('/api/v1/auth/login'), () =>
        HttpResponse.json({ status: 423, title: 'Auth.LockedOut' }, { status: 423 }),
      ),
    );
    await user.click(screen.getByRole('button', { name: 'Se connecter' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('verrouillé pendant 15 minutes');

    mswServer.use(
      http.post(api('/api/v1/auth/login'), () =>
        HttpResponse.json({ status: 429, title: 'RateLimit' }, { status: 429 }),
      ),
    );
    await user.click(screen.getByRole('button', { name: 'Se connecter' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Trop de tentatives');
  });
});
