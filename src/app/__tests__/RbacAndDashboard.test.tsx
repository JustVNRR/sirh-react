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
  it('hides unauthorized menu entries, avoids HR-only requests, and blocks 403 for EMPLOYEE', async () => {
    let hrOnlyRequested = false;
    mockAuthenticatedUser(
      [{ id: 'r-emp', code: ROLES.EMPLOYEE, name: 'Employe', priority: 2 }],
      [PERMISSIONS.EMPLOYEES_READ_SELF, PERMISSIONS.NOTIFICATIONS_READ_SELF],
      3,
    );
    mswServer.use(
      http.get(api('/api/v1/notifications'), () =>
        HttpResponse.json({
          items: [
            {
              id: 'n-1',
              recipientEmployeeId: 'e-1',
              category: 'system',
              referenceEntity: null,
              referenceId: null,
              subject: 'Bienvenue sur le SIRH',
              content: 'Votre compte est actif.',
              isRead: false,
              readAtUtc: null,
              emailSent: false,
              createdAtUtc: '2026-11-27T09:00:00Z',
            },
          ],
          page: 1,
          pageSize: 5,
          totalCount: 1,
          totalPages: 1,
        }),
      ),
      http.get(api('/api/v1/employees'), () => {
        hrOnlyRequested = true;
        return HttpResponse.json({ items: [], page: 1, pageSize: 1, totalCount: 0, totalPages: 1 });
      }),
      http.get(api('/api/v1/rse-ideas'), () => {
        hrOnlyRequested = true;
        return HttpResponse.json({ items: [], page: 1, pageSize: 1, totalCount: 0, totalPages: 1 });
      }),
    );

    renderAppAt(['/dashboard']);

    expect(await screen.findByRole('heading', { name: 'Tableau de bord' })).toBeInTheDocument();
    expect(screen.getByText('3 non lues')).toBeInTheDocument();
    expect(await screen.findByText('Bienvenue sur le SIRH')).toBeInTheDocument();
    expect(hrOnlyRequested).toBe(false);
    expect(screen.queryByRole('link', { name: 'Rôles & Permissions' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Collaborateurs' })).not.toBeInTheDocument();

    renderAppAt(['/admin/roles']);
    expect(await screen.findByText('403 — Accès refusé')).toBeInTheDocument();
  });

  it('shows HR widgets (notifications, visits, headcount, pending RSE) for HR user', async () => {
    mockAuthenticatedUser(
      [{ id: 'r-hr', code: ROLES.HR, name: 'RH', priority: 5 }],
      [
        PERMISSIONS.EMPLOYEES_READ_SELF,
        PERMISSIONS.EMPLOYEES_READ_ALL,
        PERMISSIONS.NOTIFICATIONS_READ_SELF,
        PERMISSIONS.MEDICAL_VISITS_READ_ALL,
        PERMISSIONS.RSE_READ_ALL,
        PERMISSIONS.COMPANIES_READ,
        PERMISSIONS.ROLES_READ,
      ],
      2,
    );
    mswServer.use(
      http.get(api('/api/v1/notifications'), () =>
        HttpResponse.json({
          items: [
            {
              id: 'n-2',
              recipientEmployeeId: 'e-1',
              category: 'medicalVisitReminder',
              referenceEntity: 'MedicalVisit',
              referenceId: 'mv-1',
              subject: 'Rappel visite annuelle',
              content: 'Visite demain à 10h.',
              isRead: false,
              readAtUtc: null,
              emailSent: true,
              createdAtUtc: '2026-11-27T08:00:00Z',
            },
          ],
          page: 1,
          pageSize: 5,
          totalCount: 1,
          totalPages: 1,
        }),
      ),
      http.get(api('/api/v1/medical-visits'), () =>
        HttpResponse.json({
          items: [
            {
              id: 'mv-1',
              employeeId: 'e-2',
              visitType: 'hiring',
              visitDateTimeUtc: '2026-12-02T09:00:00Z',
              validityDate: null,
              medicalCenter: 'AST Grand Paris',
              carriedOut: false,
              comments: null,
              convocationFileName: 'convocation.pdf',
              convocationContentType: 'application/pdf',
              convocationFileSizeBytes: 12000,
              hasReport: false,
              reportFileName: null,
              reportContentType: null,
              reportFileSizeBytes: null,
              reminderSentAtUtc: null,
              createdAtUtc: '2026-11-20T09:00:00Z',
              updatedAtUtc: '2026-11-20T09:00:00Z',
              rowVersion: '1',
            },
          ],
          page: 1,
          pageSize: 5,
          totalCount: 4,
          totalPages: 1,
        }),
      ),
      http.get(api('/api/v1/employees'), () =>
        HttpResponse.json({
          items: [],
          page: 1,
          pageSize: 1,
          totalCount: 42,
          totalPages: 42,
        }),
      ),
      http.get(api('/api/v1/rse-ideas'), () =>
        HttpResponse.json({
          items: [],
          page: 1,
          pageSize: 1,
          totalCount: 7,
          totalPages: 7,
        }),
      ),
    );

    renderAppAt(['/dashboard']);

    expect(await screen.findByText('42')).toBeInTheDocument();
    expect(await screen.findByText('7')).toBeInTheDocument();
    expect(await screen.findByText('Rappel visite annuelle')).toBeInTheDocument();
    expect(await screen.findByText(/AST Grand Paris/i)).toBeInTheDocument();
  });

  it('shows restricted access banner for UNKNOWN role with no permissions', async () => {
    mockAuthenticatedUser([{ id: 'r-unk', code: ROLES.UNKNOWN, name: 'Inconnu', priority: 0 }], []);

    renderAppAt(['/dashboard']);

    expect(await screen.findByText('Accès restreint')).toBeInTheDocument();
  });
});
