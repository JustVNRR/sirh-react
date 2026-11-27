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
          PERMISSIONS.EMPLOYEES_READ_ALL,
          PERMISSIONS.EMERGENCY_CONTACTS_READ_ALL,
          PERMISSIONS.EMERGENCY_CONTACTS_WRITE_ALL,
          PERMISSIONS.POSITIONS_READ_ALL,
          PERMISSIONS.POSITIONS_WRITE,
          PERMISSIONS.LOCATIONS_READ,
        ],
        unreadNotificationsCount: 0,
      }),
    ),
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
        personalLandline: null,
        personalMobile: null,
        address: null,
        departments: [],
        roles: ['EMPLOYEE'],
        isActive: true,
        currentlyInPosition: true,
        createdAtUtc: '2026-11-27T00:00:00Z',
        updatedAtUtc: '2026-11-27T00:00:00Z',
        rowVersion: 'v1',
      }),
    ),
    http.get(api('/api/v1/referentials/departments'), () =>
      HttpResponse.json([{ code: 'DEPT_HR', label: 'Ressources Humaines' }]),
    ),
    http.get(api('/api/v1/locations'), () =>
      HttpResponse.json({ items: [], page: 1, pageSize: 100, totalCount: 0, totalPages: 1 }),
    ),
    http.get(api('/api/v1/employees'), () =>
      HttpResponse.json({
        items: [
          {
            id: 'e-1',
            userId: 'u-1',
            companyId: 'c-1',
            directManagerId: null,
            slug: 'camille-dubois',
            honorific: 'Mme',
            firstName: 'Camille',
            lastName: 'Dubois',
            email: 'cdubois@nova-conseil.fr',
            mobile: null,
            departments: [],
            roles: ['EMPLOYEE'],
            isActive: true,
            currentlyInPosition: true,
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

describe('Emergency Contacts & Positions (US-F016, US-F017)', () => {
  it('enforces max 2 emergency contacts and at least one phone number', async () => {
    const user = userEvent.setup();
    setupHrSession();

    let contacts = [
      {
        id: 'ec-1',
        employeeId: 'e-1',
        fullName: 'Paul Dubois',
        relationship: 'Conjoint',
        mobilePhone: '0601020304' as string | null,
        homePhone: null,
        workPhone: null,
        priorityOrder: 1,
        createdAtUtc: '2026-11-27T00:00:00Z',
        updatedAtUtc: '2026-11-27T00:00:00Z',
        rowVersion: 'v1',
      },
    ];

    mswServer.use(
      http.get(api('/api/v1/employees/e-1/emergency-contacts'), () => HttpResponse.json(contacts)),
      http.post(api('/api/v1/employees/e-1/emergency-contacts'), async ({ request }) => {
        const body = (await request.json()) as {
          fullName: string;
          relationship: string;
          mobilePhone: string | null;
          priorityOrder: number;
        };
        const created = {
          id: 'ec-2',
          employeeId: 'e-1',
          fullName: body.fullName,
          relationship: body.relationship,
          mobilePhone: body.mobilePhone,
          homePhone: null,
          workPhone: null,
          priorityOrder: body.priorityOrder,
          createdAtUtc: '2026-11-27T00:00:00Z',
          updatedAtUtc: '2026-11-27T00:00:00Z',
          rowVersion: 'v1',
        };
        contacts = [...contacts, created];
        return HttpResponse.json(created, { status: 201 });
      }),
    );

    renderAppAt(['/employees/e-1']);
    await user.click(await screen.findByRole('tab', { name: /Contacts d'urgence/i }));

    expect(await screen.findByText('Paul Dubois')).toBeInTheDocument();
    expect(screen.getByText('Contacts enregistrés : 1 / 2')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Ajouter un contact/i }));
    await user.type(screen.getByLabelText(/Nom complet/i), 'Claire Dubois');
    await user.type(screen.getByLabelText(/Lien de parenté/i), 'Mère');
    await user.click(screen.getByRole('button', { name: 'Ajouter' }));

    expect(await screen.findByText(/Au moins un numéro de téléphone/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/^Mobile/i), '0699887766');
    await user.click(screen.getByRole('button', { name: 'Ajouter' }));

    expect(await screen.findByText('Claire Dubois')).toBeInTheDocument();
    expect(screen.getByText('Maximum 2 contacts atteint')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ajouter un contact/i })).toBeDisabled();
  });

  it('displays current position badge, validates dates/self-manager, and shows 409 on linked delete', async () => {
    const user = userEvent.setup();
    setupHrSession();

    mswServer.use(
      http.get(api('/api/v1/employees/e-1/positions'), () =>
        HttpResponse.json([
          {
            id: 'pos-1',
            slug: 'poste-camille-dubois',
            employeeId: 'e-1',
            managerId: null,
            locationId: null,
            jobTitle: 'Ingénieure .NET',
            startAt: '2025-01-01',
            endAt: null,
            isCurrent: true,
            contractLabel: 'CDI',
            coefficient: null,
            rate: null,
            supervisor: null,
            timeContractType: 'Days',
            timeContractAmount: 218,
            hierarchicalPosition: 'Cadre',
            departments: [],
            createdAtUtc: '2026-11-27T00:00:00Z',
            updatedAtUtc: '2026-11-27T00:00:00Z',
            rowVersion: 'v1',
          },
        ]),
      ),
      http.delete(api('/api/v1/positions/pos-1'), () =>
        HttpResponse.json(
          { status: 409, title: 'Positions.InUse', detail: 'Ce poste est lié à un contrat actif.' },
          { status: 409 },
        ),
      ),
    );

    renderAppAt(['/employees/e-1']);
    await user.click(await screen.findByRole('tab', { name: /Postes & Historique/i }));

    expect(await screen.findByText('Ingénieure .NET')).toBeInTheDocument();
    expect(screen.getByText('Poste actuel')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Ajouter un poste/i }));
    await user.type(screen.getByLabelText(/Intitulé du poste/i), 'Lead Dev');
    await user.type(screen.getByLabelText(/Date de début/i), '2026-06-01');
    await user.type(screen.getByLabelText(/Date de fin/i), '2026-01-01');
    await user.selectOptions(screen.getByLabelText(/^Manager/i), 'e-1');
    await user.click(screen.getByRole('button', { name: 'Créer' }));

    expect(await screen.findByText(/postérieure ou égale à la date de début/i)).toBeInTheDocument();
    expect(screen.getByText(/ne peut pas être son propre manager/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Annuler' }));
    await user.click(screen.getByRole('button', { name: 'Supprimer le poste Ingénieure .NET' }));
    await user.click(screen.getByRole('button', { name: 'Supprimer' }));

    await waitFor(() => {
      expect(screen.getByText(/lié à un contrat actif/i)).toBeInTheDocument();
    });
  });
});
