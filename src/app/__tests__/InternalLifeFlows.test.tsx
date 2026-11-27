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

function setupSession(permissions: string[], roleCode: string = ROLES.CSE) {
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
        roles: [{ id: 'r-1', code: roleCode, name: roleCode, priority: 5 }],
        permissions,
        unreadNotificationsCount: 0,
      }),
    ),
    http.get(api('/api/v1/companies'), () =>
      HttpResponse.json({
        items: [
          {
            id: 'c-1',
            name: 'Nova Conseil',
            siret: '12345678901234',
            collectiveAgreement: 'Syntec',
            isActive: true,
            rowVersion: '1',
          },
        ],
        page: 1,
        pageSize: 100,
        totalCount: 1,
        totalPages: 1,
      }),
    ),
  );
}

describe('InternalLife flows (Common Docs, Welcome Kits, CSE & RSE)', () => {
  it('enforces CSE write scope on common documents and sends archive rowVersion', async () => {
    setupSession([PERMISSIONS.COMMON_DOCS_READ, PERMISSIONS.COMMON_DOCS_WRITE_CSE]);
    let archivePayload: Record<string, unknown> | null = null;

    mswServer.use(
      http.get(api('/api/v1/common-documents'), () =>
        HttpResponse.json({
          items: [
            {
              id: 'doc-cse',
              companyId: 'c-1',
              contractTypeId: null,
              category: 'csePv',
              isWelcomeKit: false,
              title: 'PV CSE Novembre 2026',
              description: null,
              fileName: 'pv-cse.pdf',
              contentType: 'application/pdf',
              fileSizeBytes: 15000,
              fileDate: '2026-11-15',
              isArchived: false,
              createdAtUtc: '2026-11-15T10:00:00Z',
              updatedAtUtc: '2026-11-15T10:00:00Z',
              rowVersion: 'rv-cse',
            },
            {
              id: 'doc-hr',
              companyId: 'c-1',
              contractTypeId: null,
              category: 'companyAgreements',
              isWelcomeKit: false,
              title: 'Accord Télétravail',
              description: null,
              fileName: 'accord-tt.pdf',
              contentType: 'application/pdf',
              fileSizeBytes: 18000,
              fileDate: '2026-10-01',
              isArchived: false,
              createdAtUtc: '2026-10-01T10:00:00Z',
              updatedAtUtc: '2026-10-01T10:00:00Z',
              rowVersion: 'rv-hr',
            },
          ],
          page: 1,
          pageSize: 20,
          totalCount: 2,
          totalPages: 1,
        }),
      ),
      http.patch(api('/api/v1/common-documents/doc-cse/archive'), async ({ request }) => {
        archivePayload = (await request.json()) as Record<string, unknown>;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const user = userEvent.setup();
    renderAppAt(['/internal-life/documents']);

    expect(await screen.findByText('PV CSE Novembre 2026')).toBeInTheDocument();
    expect(screen.getByText('Accord Télétravail')).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: 'Archiver PV CSE Novembre 2026' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Archiver Accord Télétravail' }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Archiver PV CSE Novembre 2026' }));
    await waitFor(() => expect(archivePayload).not.toBeNull());
    expect(archivePayload).toEqual({ isArchived: true, rowVersion: 'rv-cse' });
  });

  it('filters welcome kits by contractTypeId including universal kits', async () => {
    setupSession([PERMISSIONS.WELCOME_KITS_READ], ROLES.EMPLOYEE);
    let lastQuery = '';

    mswServer.use(
      http.get(api('/api/v1/contract-types'), () =>
        HttpResponse.json({
          items: [{ id: 'ct-cdi', code: 'CDI', label: 'CDI', isSystem: true, rowVersion: '1' }],
          page: 1,
          pageSize: 100,
          totalCount: 1,
          totalPages: 1,
        }),
      ),
      http.get(api('/api/v1/common-documents'), ({ request }) => {
        lastQuery = new URL(request.url).search;
        return HttpResponse.json({
          items: [
            {
              id: 'kit-1',
              companyId: null,
              contractTypeId: null,
              category: 'welcomeKitBooklet',
              isWelcomeKit: true,
              title: 'Livret d’accueil général',
              description: 'Guide pour tous les nouveaux arrivants',
              fileName: 'livret.pdf',
              contentType: 'application/pdf',
              fileSizeBytes: 50000,
              fileDate: '2026-01-01',
              isArchived: false,
              createdAtUtc: '2026-01-01T10:00:00Z',
              updatedAtUtc: '2026-01-01T10:00:00Z',
              rowVersion: '1',
            },
          ],
          page: 1,
          pageSize: 50,
          totalCount: 1,
          totalPages: 1,
        });
      }),
    );

    const user = userEvent.setup();
    renderAppAt(['/internal-life/welcome-kits']);

    expect(await screen.findByText('Livret d’accueil général')).toBeInTheDocument();
    expect(screen.getByText('Universel')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Filtrer par type de contrat'), 'ct-cdi');
    await waitFor(() => {
      expect(lastQuery).toContain('isWelcomeKit=true');
      expect(lastQuery).toContain('contractTypeId=ct-cdi');
    });
  });

  it('filters CSE staff representatives by harassmentAdvisor=true and hides write buttons for EMPLOYEE', async () => {
    setupSession([PERMISSIONS.STAFF_REPS_READ], ROLES.EMPLOYEE);
    let lastQuery = '';

    mswServer.use(
      http.get(api('/api/v1/staff-representatives'), ({ request }) => {
        lastQuery = new URL(request.url).search;
        return HttpResponse.json({
          items: [
            {
              id: 'rep-1',
              companyId: 'c-1',
              employeeId: null,
              firstName: 'Sophie',
              lastName: 'Bernard',
              email: 'sbernard@nova-conseil.fr',
              representativeRole: 'titularDelegate',
              college: 'executives',
              isHarassmentAdvisor: true,
              createdAtUtc: '2026-01-01T10:00:00Z',
              updatedAtUtc: '2026-01-01T10:00:00Z',
              rowVersion: '1',
            },
          ],
          page: 1,
          pageSize: 50,
          totalCount: 1,
          totalPages: 1,
        });
      }),
    );

    const user = userEvent.setup();
    renderAppAt(['/internal-life/staff-representatives']);

    expect(await screen.findByText('Sophie Bernard')).toBeInTheDocument();
    expect(screen.getByText('Référent harcèlement')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Ajouter un représentant/i }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByLabelText(/Référents harcèlement uniquement/i));
    await waitFor(() => expect(lastQuery).toContain('harassmentAdvisor=true'));
  });

  it('locks author edit/delete on non-submitted RSE ideas and lets HR treat ideas', async () => {
    setupSession(
      [PERMISSIONS.RSE_READ_ALL, PERMISSIONS.RSE_WRITE, PERMISSIONS.RSE_TREAT],
      ROLES.HR,
    );
    let treatPayload: Record<string, unknown> | null = null;

    mswServer.use(
      http.get(api('/api/v1/locations'), () =>
        HttpResponse.json({
          items: [
            {
              id: 'loc-1',
              name: 'Paris',
              city: 'Paris',
              colorCode: '#4F46E5',
              isPublished: true,
              rowVersion: '1',
            },
          ],
          page: 1,
          pageSize: 100,
          totalCount: 1,
          totalPages: 1,
        }),
      ),
      http.get(api('/api/v1/rse-ideas'), () =>
        HttpResponse.json({
          items: [
            {
              id: 'idea-sub',
              authorEmployeeId: 'e-1',
              locationId: 'loc-1',
              title: 'Fontaines à eau',
              ideaContent: 'Installer des fontaines filtrantes.',
              hasAttachment: false,
              attachmentFileName: null,
              attachmentContentType: null,
              attachmentFileSizeBytes: null,
              status: 'submitted',
              rhComment: null,
              treatedByEmployeeId: null,
              treatedAtUtc: null,
              createdAtUtc: '2026-11-20T10:00:00Z',
              updatedAtUtc: '2026-11-20T10:00:00Z',
              rowVersion: 'rv-1',
            },
            {
              id: 'idea-rev',
              authorEmployeeId: 'e-1',
              locationId: null,
              title: 'Vélos électriques',
              ideaContent: 'Forfait mobilité durable.',
              hasAttachment: false,
              attachmentFileName: null,
              attachmentContentType: null,
              attachmentFileSizeBytes: null,
              status: 'inReview',
              rhComment: 'À l’étude au CSE',
              treatedByEmployeeId: 'e-hr',
              treatedAtUtc: '2026-11-25T10:00:00Z',
              createdAtUtc: '2026-11-18T10:00:00Z',
              updatedAtUtc: '2026-11-25T10:00:00Z',
              rowVersion: 'rv-2',
            },
          ],
          page: 1,
          pageSize: 50,
          totalCount: 2,
          totalPages: 1,
        }),
      ),
      http.patch(api('/api/v1/rse-ideas/idea-sub/status'), async ({ request }) => {
        treatPayload = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          id: 'idea-sub',
          authorEmployeeId: 'e-1',
          locationId: 'loc-1',
          title: 'Fontaines à eau',
          ideaContent: 'Installer des fontaines filtrantes.',
          hasAttachment: false,
          attachmentFileName: null,
          attachmentContentType: null,
          attachmentFileSizeBytes: null,
          status: 'treated',
          rhComment: 'Validé pour Q1 2027',
          treatedByEmployeeId: 'e-1',
          treatedAtUtc: '2026-11-27T10:00:00Z',
          createdAtUtc: '2026-11-20T10:00:00Z',
          updatedAtUtc: '2026-11-27T10:00:00Z',
          rowVersion: 'rv-3',
        });
      }),
    );

    const user = userEvent.setup();
    renderAppAt(['/internal-life/rse-ideas']);

    expect(await screen.findByText('Fontaines à eau')).toBeInTheDocument();
    expect(screen.getByText('À l’étude au CSE')).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: /Modifier l’idée Fontaines à eau/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Modifier l’idée Vélos électriques/i }),
    ).not.toBeInTheDocument();

    const treatButtons = screen.getAllByRole('button', { name: 'Traiter' });
    const firstTreat = treatButtons[0];
    if (!firstTreat) {
      throw new Error('Expected Traiter button');
    }
    await user.click(firstTreat);

    await user.selectOptions(screen.getByLabelText('Nouveau statut'), 'treated');
    await user.type(screen.getByLabelText('Commentaire RH'), 'Validé pour Q1 2027');
    await user.click(screen.getByRole('button', { name: 'Enregistrer la décision' }));

    await waitFor(() => expect(treatPayload).not.toBeNull());
    expect(treatPayload).toEqual({
      status: 'treated',
      rhComment: 'Validé pour Q1 2027',
      rowVersion: 'rv-1',
    });
  });
});
