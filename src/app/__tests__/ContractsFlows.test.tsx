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

function setupHrSession() {
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
        userId: 'u-hr',
        employeeId: 'e-hr',
        email: 'hr@nova-conseil.fr',
        isActive: true,
        maxRolePriority: 5,
        roles: [{ id: 'r-hr', code: ROLES.HR, name: 'RH', priority: 5 }],
        permissions: [
          PERMISSIONS.CONTRACT_MODELS_READ,
          PERMISSIONS.CONTRACT_MODELS_WRITE,
          PERMISSIONS.CONTRACTS_READ_ALL,
          PERMISSIONS.CONTRACTS_WRITE,
          PERMISSIONS.CONTRACT_TYPES_READ,
          PERMISSIONS.EMPLOYEES_READ_ALL,
          PERMISSIONS.POSITIONS_READ_ALL,
          PERMISSIONS.JOBSHEETS_READ_ALL,
          PERMISSIONS.JOBSHEETS_WRITE,
        ],
        unreadNotificationsCount: 0,
      }),
    ),
    http.get(api('/api/v1/contract-types'), () =>
      HttpResponse.json({
        items: [
          {
            id: 'ct-cdi',
            code: 'CDI',
            label: 'Contrat à Durée Indéterminée',
            isSystem: true,
            rowVersion: '1',
          },
        ],
        page: 1,
        pageSize: 100,
        totalCount: 1,
        totalPages: 1,
      }),
    ),
    http.get(api('/api/v1/employees'), () =>
      HttpResponse.json({
        items: [
          {
            id: 'e-1',
            firstName: 'Camille',
            lastName: 'Dubois',
            email: 'cdubois@nova-conseil.fr',
            slug: 'camille-dubois',
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
    http.get(api('/api/v1/employees/e-1/positions'), () =>
      HttpResponse.json([
        {
          id: 'pos-1',
          employeeId: 'e-1',
          companyId: 'c-1',
          locationId: null,
          managerId: null,
          jobTitle: 'Développeuse Fullstack',
          hierarchicalPosition: 'Cadre',
          startAt: '2026-01-10',
          endAt: null,
          isCurrent: true,
          timeContractType: 'Hours',
          timeContractAmount: 35,
          coefficient: '150',
          salary: null,
          rowVersion: 'v1',
        },
      ]),
    ),
  );
}

describe('Contracts Studio, Contracts & JobSheets flows', () => {
  it('inserts Scriban variable, previews PDF blob, and handles 409 on contract generate', async () => {
    setupHrSession();
    mswServer.use(
      http.get(api('/api/v1/contract-models/variables'), () =>
        HttpResponse.json([
          {
            key: 'employee.full_name',
            category: 'employee',
            description: 'Nom complet du salarié',
          },
        ]),
      ),
      http.get(api('/api/v1/contract-models/m-1'), () =>
        HttpResponse.json({
          id: 'm-1',
          title: 'CDI Cadre Syntec',
          description: 'Modèle standard',
          contractTypeId: 'ct-cdi',
          templateContent: '# Contrat de travail',
          customVariables: ['trial_months'],
          isActive: true,
          createdAtUtc: '2026-11-01T10:00:00Z',
          updatedAtUtc: '2026-11-01T10:00:00Z',
          rowVersion: 'rv-1',
        }),
      ),
      http.post(api('/api/v1/contract-models/m-1/preview'), () =>
        HttpResponse.arrayBuffer(new TextEncoder().encode('%PDF-1.4').buffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'inline; filename="apercu-cdi.pdf"',
          },
        }),
      ),
      http.post(api('/api/v1/contracts/generate'), () =>
        HttpResponse.json(
          { status: 409, title: 'Contract.AlreadyExists', detail: 'Position already has contract' },
          { status: 409 },
        ),
      ),
    );

    const user = userEvent.setup();
    renderAppAt(['/contracts/models/m-1']);

    const varBtn = await screen.findByRole('button', { name: 'employee.full_name' });
    await user.click(varBtn);

    const editor = screen.getByLabelText(/Contenu Markdown \/ Scriban/i) as HTMLTextAreaElement;
    expect(editor.value).toContain('{{ employee.full_name }}');

    await user.selectOptions(screen.getByLabelText('Collaborateur'), 'e-1');
    await waitFor(() => expect(screen.getByLabelText('Poste cible')).not.toBeDisabled());
    await user.selectOptions(screen.getByLabelText('Poste cible'), 'pos-1');

    await user.click(screen.getByRole('button', { name: /Prévisualiser le PDF/i }));
    expect(await screen.findByText(/Aperçu — CDI Cadre Syntec/i)).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: /Générer le contrat/i }));
    expect(await screen.findByText(/possède déjà un contrat associé/i)).toBeInTheDocument();
  });

  it('updates contract status to signed with signedAt and renders PositionJobSheetBar', async () => {
    setupHrSession();
    let putPayload: Record<string, unknown> | null = null;

    mswServer.use(
      http.get(api('/api/v1/contracts'), () =>
        HttpResponse.json({
          items: [
            {
              id: 'c-1',
              positionId: 'pos-1',
              employeeId: 'e-1',
              contractTypeId: 'ct-cdi',
              contractModelId: 'm-1',
              status: 'pendingSignature',
              signedAt: null,
              fileName: 'cdi-dubois.pdf',
              contentType: 'application/pdf',
              fileSizeBytes: 24500,
              fileDate: '2026-11-20',
              commentary: null,
              createdAtUtc: '2026-11-20T10:00:00Z',
              updatedAtUtc: '2026-11-20T10:00:00Z',
              rowVersion: 'rv-c1',
            },
          ],
          page: 1,
          pageSize: 20,
          totalCount: 1,
          totalPages: 1,
        }),
      ),
      http.put(api('/api/v1/contracts/c-1'), async ({ request }) => {
        putPayload = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          id: 'c-1',
          positionId: 'pos-1',
          employeeId: 'e-1',
          contractTypeId: 'ct-cdi',
          contractModelId: 'm-1',
          status: 'signed',
          signedAt: '2026-11-25',
          fileName: 'cdi-dubois.pdf',
          contentType: 'application/pdf',
          fileSizeBytes: 24500,
          fileDate: '2026-11-20',
          commentary: null,
          createdAtUtc: '2026-11-20T10:00:00Z',
          updatedAtUtc: '2026-11-25T10:00:00Z',
          rowVersion: 'rv-c2',
        });
      }),
    );

    const user = userEvent.setup();
    renderAppAt(['/contracts']);

    expect(await screen.findByText('cdi-dubois.pdf')).toBeInTheDocument();
    expect(screen.getAllByText('En attente de signature').length).toBeGreaterThanOrEqual(2);

    await user.click(screen.getByRole('button', { name: 'Modifier cdi-dubois.pdf' }));
    await user.selectOptions(screen.getByLabelText('Statut'), 'signed');
    await user.type(screen.getByLabelText('Date de signature'), '2026-11-25');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() => expect(putPayload).not.toBeNull());
    expect(putPayload).toMatchObject({
      status: 'signed',
      signedAt: '2026-11-25',
      rowVersion: 'rv-c1',
    });
  });

  it('displays PositionJobSheetBar on employee profile positions tab', async () => {
    setupHrSession();
    mswServer.use(
      http.get(api('/api/v1/employees/e-1'), () =>
        HttpResponse.json({
          id: 'e-1',
          userId: 'u-1',
          companyId: 'c-1',
          directManagerId: null,
          slug: 'camille-dubois',
          honorific: 'Mme',
          firstName: 'Camille',
          lastName: 'Dubois',
          bornAt: null,
          birthPlace: null,
          birthDepartmentCode: null,
          nationalId: null,
          email: 'cdubois@nova-conseil.fr',
          landline: null,
          mobile: null,
          personalEmail: null,
          personalMobile: null,
          addressLine1: null,
          addressLine2: null,
          postalCode: null,
          city: null,
          country: null,
          departments: [],
          roles: ['EMPLOYEE'],
          isActive: true,
          currentlyInPosition: true,
          rowVersion: '1',
        }),
      ),
      http.get(api('/api/v1/referentials/departments'), () => HttpResponse.json([])),
      http.get(api('/api/v1/job-sheets/by-position/pos-1'), () =>
        HttpResponse.json({
          id: 'js-1',
          positionId: 'pos-1',
          employeeId: 'e-1',
          fileName: 'fiche-fullstack.pdf',
          contentType: 'application/pdf',
          fileSizeBytes: 12000,
          fileDate: '2026-01-10',
          commentary: null,
          createdAtUtc: '2026-01-10T09:00:00Z',
          updatedAtUtc: '2026-01-10T09:00:00Z',
          rowVersion: 'js-v1',
        }),
      ),
      http.get(api('/api/v1/job-sheets/js-1/file'), () =>
        HttpResponse.arrayBuffer(new TextEncoder().encode('%PDF-1.4').buffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'inline; filename="fiche-fullstack.pdf"',
          },
        }),
      ),
    );

    const user = userEvent.setup();
    renderAppAt(['/employees/e-1']);

    const positionsTab = await screen.findByRole('tab', { name: /Postes & Historique/i });
    await user.click(positionsTab);

    expect(await screen.findByText('fiche-fullstack.pdf')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Voir fiche de poste/i }));
    expect(await screen.findByText(/Fiche de poste — Développeuse Fullstack/i)).toBeInTheDocument();
  });
});
