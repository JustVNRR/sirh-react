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

function setupSession(permissions: string[], unreadNotificationsCount = 2) {
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
        unreadNotificationsCount,
      }),
    ),
  );
}

describe('Health & Notifications flows', () => {
  it('blocks medical visit creation without convocationFile and submits multipart when provided', async () => {
    setupSession([
      PERMISSIONS.MEDICAL_VISITS_READ_ALL,
      PERMISSIONS.MEDICAL_VISITS_WRITE,
      PERMISSIONS.EMPLOYEES_READ_ALL,
    ]);

    let postCount = 0;
    mswServer.use(
      http.get(api('/api/v1/employees'), () =>
        HttpResponse.json({
          items: [
            {
              id: 'e-2',
              firstName: 'Lucas',
              lastName: 'Martin',
              email: 'lmartin@nova-conseil.fr',
              slug: 'lucas-martin',
              isActive: true,
              currentlyInPosition: true,
              companyId: 'c-1',
              roles: ['EMPLOYEE'],
              departments: ['75'],
            },
          ],
          page: 1,
          pageSize: 100,
          totalCount: 1,
          totalPages: 1,
        }),
      ),
      http.get(api('/api/v1/medical-visits'), () =>
        HttpResponse.json({
          items: [],
          page: 1,
          pageSize: 20,
          totalCount: 0,
          totalPages: 1,
        }),
      ),
      http.post(api('/api/v1/medical-visits'), () => {
        postCount += 1;
        return HttpResponse.json(
          {
            id: 'mv-new',
            employeeId: 'e-2',
            visitType: 'hiring',
            visitDateTimeUtc: '2026-12-10T09:30:00Z',
            validityDate: null,
            medicalCenter: 'AST Paris',
            carriedOut: false,
            comments: null,
            convocationFileName: 'convoc.pdf',
            convocationContentType: 'application/pdf',
            convocationFileSizeBytes: 1024,
            hasReport: false,
            reportFileName: null,
            reportContentType: null,
            reportFileSizeBytes: null,
            reminderSentAtUtc: null,
            createdAtUtc: '2026-11-27T10:00:00Z',
            updatedAtUtc: '2026-11-27T10:00:00Z',
            rowVersion: '1',
          },
          { status: 201 },
        );
      }),
    );

    const user = userEvent.setup();
    renderAppAt(['/health/medical-visits']);

    await user.click(await screen.findByRole('button', { name: /Planifier une visite/i }));
    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Lucas Martin' })).toBeInTheDocument(),
    );
    await user.selectOptions(screen.getByLabelText('Collaborateur'), 'e-2');
    await user.selectOptions(screen.getByLabelText('Type de visite'), 'hiring');
    await user.type(screen.getByLabelText(/Date et heure/i), '2026-12-10T09:30');
    await user.click(screen.getByRole('button', { name: 'Planifier' }));

    expect(
      await screen.findByText(/Le fichier de convocation est obligatoire/i),
    ).toBeInTheDocument();
    expect(postCount).toBe(0);

    const fileInput = document.getElementById('mv-convocation-file') as HTMLInputElement;
    const pdfFile = new File(['%PDF-1.4'], 'convoc.pdf', { type: 'application/pdf' });
    await user.upload(fileInput, pdfFile);
    await user.click(screen.getByRole('button', { name: 'Planifier' }));

    await waitFor(() => expect(postCount).toBe(1));
  });

  it('displays employee medical visits and opens convocation and report previews', async () => {
    setupSession([PERMISSIONS.MEDICAL_VISITS_READ_SELF]);
    mswServer.use(
      http.get(api('/api/v1/medical-visits'), () =>
        HttpResponse.json({
          items: [
            {
              id: 'mv-1',
              employeeId: 'e-1',
              visitType: 'followUp',
              visitDateTimeUtc: '2026-12-05T14:00:00Z',
              validityDate: '2028-12-05',
              medicalCenter: 'AST Lyon',
              carriedOut: true,
              comments: null,
              convocationFileName: 'convoc-1.pdf',
              convocationContentType: 'application/pdf',
              convocationFileSizeBytes: 5000,
              hasReport: true,
              reportFileName: 'rapport-1.pdf',
              reportContentType: 'application/pdf',
              reportFileSizeBytes: 8000,
              reminderSentAtUtc: null,
              createdAtUtc: '2026-11-01T10:00:00Z',
              updatedAtUtc: '2026-11-01T10:00:00Z',
              rowVersion: '1',
            },
          ],
          page: 1,
          pageSize: 20,
          totalCount: 1,
          totalPages: 1,
        }),
      ),
      http.get(api('/api/v1/medical-visits/mv-1/convocation-file'), () =>
        HttpResponse.arrayBuffer(new TextEncoder().encode('%PDF-1.4').buffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'inline; filename="convoc-1.pdf"',
          },
        }),
      ),
      http.get(api('/api/v1/medical-visits/mv-1/report-file'), () =>
        HttpResponse.arrayBuffer(new TextEncoder().encode('%PDF-1.4').buffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'inline; filename="rapport-1.pdf"',
          },
        }),
      ),
    );

    const user = userEvent.setup();
    renderAppAt(['/health/medical-visits']);

    expect(
      await screen.findByRole('heading', { name: 'Mes visites médicales' }),
    ).toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: 'Convocation' }));
    expect(await screen.findByText('convoc-1.pdf')).toBeInTheDocument();
    await user.keyboard('{Escape}');

    await user.click(screen.getByRole('button', { name: 'Rapport' }));
    expect(await screen.findByText('rapport-1.pdf')).toBeInTheDocument();
  });

  it('filters notifications, marks all as read, updates header badge to 0, and deletes notification', async () => {
    setupSession([PERMISSIONS.NOTIFICATIONS_READ_SELF, PERMISSIONS.NOTIFICATIONS_WRITE_SELF], 2);

    let lastQuery = '';
    let readAllCalled = false;
    let deletedId = '';

    mswServer.use(
      http.get(api('/api/v1/notifications'), ({ request }) => {
        lastQuery = new URL(request.url).search;
        return HttpResponse.json({
          items: [
            {
              id: 'notif-1',
              recipientEmployeeId: 'e-1',
              category: 'medicalVisitReminder',
              referenceEntity: 'MedicalVisit',
              referenceId: 'mv-1',
              subject: 'Convocation visite périodique',
              content: 'Votre visite est prévue le 05/12/2026.',
              isRead: false,
              readAtUtc: null,
              emailSent: true,
              createdAtUtc: '2026-11-27T08:00:00Z',
            },
          ],
          page: 1,
          pageSize: 20,
          totalCount: 1,
          totalPages: 1,
        });
      }),
      http.post(api('/api/v1/notifications/read-all'), () => {
        readAllCalled = true;
        return new HttpResponse(null, { status: 204 });
      }),
      http.delete(api('/api/v1/notifications/notif-1'), () => {
        deletedId = 'notif-1';
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const user = userEvent.setup();
    renderAppAt(['/notifications']);

    expect(await screen.findByText('Convocation visite périodique')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Filtrer par statut de lecture'), 'unread');
    await user.selectOptions(
      screen.getByLabelText('Filtrer par catégorie'),
      'medicalVisitReminder',
    );
    await waitFor(() => {
      expect(lastQuery).toContain('isRead=false');
      expect(lastQuery).toContain('category=medicalVisitReminder');
    });

    await user.click(screen.getByRole('button', { name: /Tout marquer comme lu/i }));
    await waitFor(() => expect(readAllCalled).toBe(true));
    expect(screen.getByLabelText('Notifications (0 non lues)')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', {
        name: /Supprimer la notification : Convocation visite périodique/i,
      }),
    );
    await user.click(screen.getByRole('button', { name: 'Supprimer' }));
    await waitFor(() => expect(deletedId).toBe('notif-1'));
  });
});
