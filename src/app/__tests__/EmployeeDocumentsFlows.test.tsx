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

function setupSession(permissions: string[]) {
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
        maxRolePriority: 5,
        roles: [{ id: 'r-1', code: ROLES.HR, name: 'RH', priority: 5 }],
        permissions,
        unreadNotificationsCount: 0,
      }),
    ),
    http.get(api('/api/v1/employees'), () =>
      HttpResponse.json({
        items: [],
        page: 1,
        pageSize: 100,
        totalCount: 0,
        totalPages: 1,
      }),
    ),
  );
}

describe('EmployeeDocumentsFlows', () => {
  it('hides disciplinary and departure tabs without employee-docs:read:sensitive', async () => {
    setupSession([PERMISSIONS.EMPLOYEE_DOCS_READ_SELF, PERMISSIONS.EMPLOYEE_DOCS_WRITE_SELF]);
    mswServer.use(
      http.get(api('/api/v1/employee-documents'), () =>
        HttpResponse.json({
          items: [],
          page: 1,
          pageSize: 20,
          totalCount: 0,
          totalPages: 1,
        }),
      ),
    );

    renderAppAt(['/documents']);

    expect(await screen.findByRole('button', { name: 'Dossier personnel' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Disciplinaire' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Départ' })).not.toBeInTheDocument();
  });

  it('displays RQTH and ResidentPermit conditional fields and expiry alert badges', async () => {
    setupSession([
      PERMISSIONS.EMPLOYEE_DOCS_READ_ALL,
      PERMISSIONS.EMPLOYEE_DOCS_READ_SENSITIVE,
      PERMISSIONS.EMPLOYEE_DOCS_WRITE_ALL,
    ]);

    const today = new Date();
    const expiredDate = new Date(today.getTime() - 2 * 86_400_000).toISOString().slice(0, 10);
    const soonDate = new Date(today.getTime() + 10 * 86_400_000).toISOString().slice(0, 10);

    let lastQuery = '';
    mswServer.use(
      http.get(api('/api/v1/employee-documents'), ({ request }) => {
        lastQuery = new URL(request.url).search;
        return HttpResponse.json({
          items: [
            {
              id: 'doc-rqth',
              employeeId: 'e-1',
              category: 'personalFile',
              documentType: 'rqthCertificate',
              fileName: 'rqth-2026.pdf',
              contentType: 'application/pdf',
              fileSizeBytes: 18000,
              fileDate: '2026-01-01',
              commentary: null,
              rqthDetails: {
                expiryDate: soonDate,
                workplaceAccommodation: 'Siège ergonomique',
                expiryReminder30SentAtUtc: null,
                expiryReminder7SentAtUtc: null,
              },
              residentPermitDetails: null,
              createdAtUtc: '2026-01-01T10:00:00Z',
              updatedAtUtc: '2026-01-01T10:00:00Z',
              rowVersion: '1',
            },
            {
              id: 'doc-permit',
              employeeId: 'e-1',
              category: 'personalFile',
              documentType: 'residentPermit',
              fileName: 'titre-sejour.pdf',
              contentType: 'application/pdf',
              fileSizeBytes: 22000,
              fileDate: '2025-01-01',
              commentary: null,
              rqthDetails: null,
              residentPermitDetails: {
                permitNumber: '99FR12345',
                expiryDate: expiredDate,
                expiryReminder30SentAtUtc: null,
                expiryReminder7SentAtUtc: null,
              },
              createdAtUtc: '2025-01-01T10:00:00Z',
              updatedAtUtc: '2025-01-01T10:00:00Z',
              rowVersion: '1',
            },
          ],
          page: 1,
          pageSize: 20,
          totalCount: 2,
          totalPages: 1,
        });
      }),
    );

    const user = userEvent.setup();
    renderAppAt(['/documents']);

    expect(await screen.findByRole('button', { name: 'Disciplinaire' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Départ' })).toBeInTheDocument();

    expect(await screen.findByText(/Expire dans \d+ j/i)).toBeInTheDocument();
    expect(screen.getByText(/Expiré/i)).toBeInTheDocument();
    expect(screen.getByText(/Aménagement : Siège ergonomique/i)).toBeInTheDocument();
    expect(screen.getByText(/N° 99FR12345/i)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Filtrer par type de document'), 'iban');
    await waitFor(() => expect(lastQuery).toContain('documentTypes=iban'));

    await user.click(screen.getByRole('button', { name: /Déposer un document/i }));
    await user.selectOptions(screen.getByLabelText('Type de pièce'), 'rqthCertificate');
    expect(screen.getByLabelText(/Date d’expiration RQTH/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Aménagement de poste/i)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Type de pièce'), 'residentPermit');
    expect(screen.getByLabelText(/Numéro de titre de séjour/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Date d’expiration/i)).toBeInTheDocument();
  });
});
