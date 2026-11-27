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

function setupSession(permissions: string[], roleCode: string = ROLES.ADMIN) {
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
        roles: [{ id: 'r-1', code: roleCode, name: roleCode, priority: 6 }],
        permissions,
        unreadNotificationsCount: 0,
      }),
    ),
  );
}

describe('Organization Flows (Companies, Locations, ContractTypes, Departments)', () => {
  it('validates SIRET, defaults Syntec, creates company, and handles 409 conflict', async () => {
    const user = userEvent.setup();
    setupSession([PERMISSIONS.COMPANIES_READ, PERMISSIONS.COMPANIES_WRITE]);

    let companies = [
      {
        id: 'c-1',
        name: 'Nova Conseil',
        slug: 'nova-conseil',
        legalForm: 'SAS',
        address: '10 rue de Paris',
        postalCode: '75001',
        city: 'Paris',
        country: 'France',
        siret: '73282932000074',
        register: null,
        capital: null,
        collectiveAgreement: 'Syntec',
        owner: null,
        logoUrl: null,
        isActive: true,
        createdAtUtc: '2026-11-27T00:00:00Z',
        updatedAtUtc: '2026-11-27T00:00:00Z',
        rowVersion: 'v1',
      },
    ];

    mswServer.use(
      http.get(api('/api/v1/companies'), () =>
        HttpResponse.json({
          items: companies,
          page: 1,
          pageSize: 20,
          totalCount: companies.length,
          totalPages: 1,
        }),
      ),
      http.post(api('/api/v1/companies'), async ({ request }) => {
        const body = (await request.json()) as {
          name: string;
          siret: string;
          collectiveAgreement: string;
        };
        const base = companies[0];
        if (!base) {
          throw new Error('Missing base company');
        }
        const created = {
          ...base,
          id: 'c-2',
          name: body.name,
          siret: body.siret,
          collectiveAgreement: body.collectiveAgreement,
          rowVersion: 'v1',
        };
        companies = [...companies, created];
        return HttpResponse.json(created, { status: 201 });
      }),
      http.put(api('/api/v1/companies/c-1'), () =>
        HttpResponse.json(
          {
            status: 409,
            title: 'Concurrency.Conflict',
            detail: 'Conflit détecté sur cette fiche.',
          },
          { status: 409 },
        ),
      ),
    );

    renderAppAt(['/organization/companies']);

    expect(await screen.findByText('Nova Conseil')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Nouvelle entreprise/i }));
    expect(screen.getByLabelText(/Convention collective/i)).toHaveValue('Syntec');

    await user.type(screen.getByLabelText(/Raison sociale/i), 'Tech France');
    await user.type(screen.getByLabelText(/SIRET/i), '12345678901234');
    await user.type(screen.getByLabelText(/^Adresse/i), '5 avenue Victor Hugo');
    await user.click(screen.getByRole('button', { name: 'Créer' }));

    expect(await screen.findByText(/numéro français valide à 14 chiffres/i)).toBeInTheDocument();

    await user.clear(screen.getByLabelText(/SIRET/i));
    await user.type(screen.getByLabelText(/SIRET/i), '35600000000048');
    await user.click(screen.getByRole('button', { name: 'Créer' }));

    expect(await screen.findByText('Tech France')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Modifier Nova Conseil' }));
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(await screen.findByText(/Conflit de modification \(409\)/i)).toBeInTheDocument();
  });

  it('hides write controls on Companies when user lacks companies:write', async () => {
    setupSession([PERMISSIONS.COMPANIES_READ], ROLES.EMPLOYEE);

    mswServer.use(
      http.get(api('/api/v1/companies'), () =>
        HttpResponse.json({
          items: [
            {
              id: 'c-1',
              name: 'Nova Conseil',
              slug: 'nova-conseil',
              legalForm: 'SAS',
              address: '10 rue de Paris',
              postalCode: '75001',
              city: 'Paris',
              country: 'France',
              siret: '73282932000074',
              register: null,
              capital: null,
              collectiveAgreement: 'Syntec',
              owner: null,
              logoUrl: null,
              isActive: true,
              createdAtUtc: '2026-11-27T00:00:00Z',
              updatedAtUtc: '2026-11-27T00:00:00Z',
              rowVersion: 'v1',
            },
          ],
          page: 1,
          pageSize: 20,
          totalCount: 1,
          totalPages: 1,
        }),
      ),
    );

    renderAppAt(['/organization/companies']);

    expect(await screen.findByText('Nova Conseil')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Nouvelle entreprise/i })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Modifier Nova Conseil/i }),
    ).not.toBeInTheDocument();
  });

  it('displays 409 error when deleting a referenced Location', async () => {
    const user = userEvent.setup();
    setupSession([
      PERMISSIONS.LOCATIONS_READ,
      PERMISSIONS.LOCATIONS_WRITE,
      PERMISSIONS.COMPANIES_READ,
    ]);

    mswServer.use(
      http.get(api('/api/v1/companies'), () =>
        HttpResponse.json({ items: [], page: 1, pageSize: 100, totalCount: 0, totalPages: 1 }),
      ),
      http.get(api('/api/v1/locations'), () =>
        HttpResponse.json({
          items: [
            {
              id: 'loc-1',
              slug: 'siege-paris',
              name: 'Siège Paris',
              address: '10 rue de Paris',
              postalCode: '75001',
              city: 'Paris',
              country: 'France',
              departmentCode: '75',
              siret: null,
              colorCode: '#4F46E5',
              isPublished: true,
              companyId: null,
              createdAtUtc: '2026-11-27T00:00:00Z',
              updatedAtUtc: '2026-11-27T00:00:00Z',
              rowVersion: 'v1',
            },
          ],
          page: 1,
          pageSize: 20,
          totalCount: 1,
          totalPages: 1,
        }),
      ),
      http.delete(api('/api/v1/locations/loc-1'), () =>
        HttpResponse.json(
          {
            status: 409,
            title: 'Locations.InUse',
            detail: 'Ce lieu est référencé par un poste actif et ne peut pas être supprimé.',
          },
          { status: 409 },
        ),
      ),
    );

    renderAppAt(['/organization/locations']);

    expect(await screen.findByText('Siège Paris')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Supprimer Siège Paris' }));
    await user.click(screen.getByRole('button', { name: 'Supprimer' }));

    await waitFor(() => {
      expect(screen.getByText(/référencé par un poste actif/i)).toBeInTheDocument();
    });
  });

  it('protects system ContractTypes and displays Departments referential', async () => {
    const user = userEvent.setup();
    setupSession([PERMISSIONS.CONTRACT_TYPES_READ, PERMISSIONS.CONTRACT_TYPES_WRITE]);

    mswServer.use(
      http.get(api('/api/v1/contract-types'), () =>
        HttpResponse.json({
          items: [
            {
              id: 'ct-1',
              code: 'CDI',
              label: 'Contrat à durée indéterminée',
              isSystem: true,
              isActive: true,
              createdAtUtc: '2026-11-27T00:00:00Z',
              updatedAtUtc: '2026-11-27T00:00:00Z',
              rowVersion: 'v1',
            },
          ],
          page: 1,
          pageSize: 20,
          totalCount: 1,
          totalPages: 1,
        }),
      ),
      http.get(api('/api/v1/referentials/departments'), () =>
        HttpResponse.json([
          { code: 'DEPT_HR', label: 'Ressources Humaines' },
          { code: 'DEPT_PAY', label: 'Paie' },
        ]),
      ),
    );

    renderAppAt(['/organization/contract-types']);

    expect(await screen.findByText('CDI')).toBeInTheDocument();
    expect(screen.getByText('Ressources Humaines')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Supprimer CDI' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Modifier CDI' }));
    expect(screen.getByLabelText(/^Code/i)).toBeDisabled();
  });
});
