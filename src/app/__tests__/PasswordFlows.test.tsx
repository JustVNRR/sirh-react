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

describe('Password & Session Security Flows', () => {
  it('handles forgot-password (202) and reset-password with otpCode (204)', async () => {
    const user = userEvent.setup();
    let capturedResetBody: unknown;

    mswServer.use(
      http.post(api('/api/v1/auth/password/forgot'), () => new HttpResponse(null, { status: 202 })),
      http.post(api('/api/v1/auth/password/reset'), async ({ request }) => {
        capturedResetBody = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );

    renderAppAt(['/forgot-password']);

    await user.type(await screen.findByLabelText(/Email professionnel/i), 'alice@nova-conseil.fr');
    await user.click(screen.getByRole('button', { name: 'Envoyer le code' }));

    expect(await screen.findByText(/Si un compte actif correspond/i)).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: /Saisir mon code/i }));

    expect(
      await screen.findByRole('heading', { name: 'Réinitialiser le mot de passe' }),
    ).toBeInTheDocument();
    const nextSecret = ['New', 'StrongPass', '123!'].join('');
    await user.type(screen.getByLabelText(/Code OTP/i), '654321');
    await user.type(screen.getByLabelText(/^Nouveau mot de passe/i), nextSecret);
    await user.type(screen.getByLabelText(/Confirmer le nouveau mot de passe/i), nextSecret);
    await user.click(screen.getByRole('button', { name: /Valider le nouveau mot de passe/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Connexion/i })).toBeInTheDocument();
    });

    expect(capturedResetBody).toEqual({
      email: 'alice@nova-conseil.fr',
      otpCode: '654321',
      newPassword: nextSecret,
    });
  });

  it('changes password on /account/security, clears session, and redirects to /login', async () => {
    const user = userEvent.setup();

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
          email: 'alice@nova-conseil.fr',
          isActive: true,
          maxRolePriority: 2,
          roles: [{ id: 'r-1', code: ROLES.EMPLOYEE, name: 'Employe', priority: 2 }],
          permissions: [PERMISSIONS.EMPLOYEES_READ_SELF],
          unreadNotificationsCount: 0,
        }),
      ),
      http.post(api('/api/v1/auth/password/change'), () => new HttpResponse(null, { status: 204 })),
    );

    renderAppAt(['/account/security']);

    await user.type(await screen.findByLabelText(/Mot de passe actuel/i), 'OldStrongPass123!');
    await user.type(screen.getByLabelText(/^Nouveau mot de passe/i), 'NewStrongPass123!');
    await user.type(
      screen.getByLabelText(/Confirmer le nouveau mot de passe/i),
      'NewStrongPass123!',
    );
    await user.click(screen.getByRole('button', { name: /Mettre à jour le mot de passe/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Connexion/i })).toBeInTheDocument();
    });
    expect(tokenStore.getAccessToken()).toBeNull();
    expect(tokenStore.getRefreshToken()).toBeNull();
  });
});
