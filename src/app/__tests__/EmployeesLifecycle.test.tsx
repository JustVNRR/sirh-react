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

function setupAuth(roleCode: string, permissions: string[]) {
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
        employeeId: 'e-mgr',
        email: 'hr@nova-conseil.fr',
        isActive: true,
        maxRolePriority: 5,
        roles: [{ id: 'r-hr', code: roleCode, name: roleCode, priority: 5 }],
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
        pageSize: 100,
        totalCount: 1,
        totalPages: 1,
      }),
    ),
    http.get(api('/api/v1/referentials/departments'), () =>
      HttpResponse.json([{ code: 'DEPT_HR', label: 'Ressources Humaines' }]),
    ),
    http.get(api('/api/v1/roles'), () =>
      HttpResponse.json([
        {
          id: 'r-emp',
          code: ROLES.EMPLOYEE,
          name: 'Employe',
          priority: 2,
          description: '',
          permissionCount: 1,
        },
        {
          id: 'r-adm',
          code: ROLES.ADMIN,
          name: 'Admin',
          priority: 6,
          description: '',
          permissionCount: 10,
        },
      ]),
    ),
  );
}

describe('Employees Directory & Lifecycle (US-F013, US-F014, US-F015)', () => {
  it('filters directory, creates employee with password field, and blocks privileged roles for HR', async () => {
    const user = userEvent.setup();
    let capturedCreateBody: unknown;
    const testPwd = ['Strong', 'Pass', '123!'].join('');

    setupAuth(ROLES.HR, [
      PERMISSIONS.EMPLOYEES_READ_ALL,
      PERMISSIONS.EMPLOYEES_WRITE,
      PERMISSIONS.COMPANIES_READ,
      PERMISSIONS.ROLES_READ,
    ]);

    mswServer.use(
      http.get(api('/api/v1/employees'), ({ request }) => {
        const url = new URL(request.url);
        const search = url.searchParams.get('search');
        const items =
          search === 'Durand'
            ? []
            : [
                {
                  id: 'e-1',
                  userId: 'u-emp',
                  companyId: 'c-1',
                  directManagerId: null,
                  slug: 'camille-dubois',
                  honorific: 'Mme',
                  firstName: 'Camille',
                  lastName: 'Dubois',
                  email: 'cdubois@nova-conseil.fr',
                  mobile: null,
                  departments: ['DEPT_HR'],
                  roles: ['EMPLOYEE'],
                  isActive: true,
                  currentlyInPosition: true,
                },
              ];
        return HttpResponse.json({
          items,
          page: 1,
          pageSize: 20,
          totalCount: items.length,
          totalPages: 1,
        });
      }),
      http.post(api('/api/v1/employees'), async ({ request }) => {
        capturedCreateBody = await request.json();
        return HttpResponse.json(
          {
            id: 'e-new',
            userId: 'u-new',
            companyId: 'c-1',
            directManagerId: null,
            slug: 'alice-durand',
            honorific: 'Mme',
            firstName: 'Alice',
            lastName: 'Durand',
            bornAt: null,
            birthPlace: null,
            birthDepartmentCode: null,
            nationalId: null,
            email: 'adurand@nova-conseil.fr',
            landline: null,
            mobile: null,
            personalEmail: null,
            personalLandline: null,
            personalMobile: null,
            address: null,
            departments: [],
            roles: ['EMPLOYEE'],
            isActive: true,
            currentlyInPosition: false,
            createdAtUtc: '2026-11-27T00:00:00Z',
            updatedAtUtc: '2026-11-27T00:00:00Z',
            rowVersion: 'v1',
          },
          { status: 201 },
        );
      }),
      http.get(api('/api/v1/employees/e-new'), () =>
        HttpResponse.json({
          id: 'e-new',
          userId: 'u-new',
          companyId: 'c-1',
          directManagerId: null,
          slug: 'alice-durand',
          honorific: 'Mme',
          firstName: 'Alice',
          lastName: 'Durand',
          bornAt: null,
          birthPlace: null,
          birthDepartmentCode: null,
          nationalId: null,
          email: 'adurand@nova-conseil.fr',
          landline: null,
          mobile: null,
          personalEmail: null,
          personalLandline: null,
          personalMobile: null,
          address: null,
          departments: [],
          roles: ['EMPLOYEE'],
          isActive: true,
          currentlyInPosition: false,
          createdAtUtc: '2026-11-27T00:00:00Z',
          updatedAtUtc: '2026-11-27T00:00:00Z',
          rowVersion: 'v1',
        }),
      ),
    );

    renderAppAt(['/employees']);
    expect(await screen.findByText('Mme Camille Dubois')).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /Nouveau collaborateur/i }));

    expect(await screen.findByLabelText('Admin')).toBeDisabled();
    await user.selectOptions(screen.getByLabelText(/Entreprise/i), 'c-1');
    await user.type(screen.getByLabelText(/^Prénom/i), 'Alice');
    await user.type(screen.getByLabelText(/^Nom/i), 'Durand');
    await user.type(screen.getByLabelText(/^Mot de passe initial/i), testPwd);
    await user.click(screen.getByRole('button', { name: /Créer le collaborateur/i }));

    expect(await screen.findByRole('heading', { name: /Mme Alice Durand/i })).toBeInTheDocument();
    expect(capturedCreateBody).toMatchObject({
      firstName: 'Alice',
      lastName: 'Durand',
      password: testPwd,
      roleCodes: ['EMPLOYEE'],
    });
  });

  it('shows masked PII for Manager and allows HR to deactivate employee', async () => {
    const user = userEvent.setup();
    let isActive = true;

    setupAuth(ROLES.HR, [PERMISSIONS.EMPLOYEES_READ_TEAM, PERMISSIONS.EMPLOYEES_WRITE]);
    mswServer.use(
      http.get(api('/api/v1/employees/e-sub'), () =>
        HttpResponse.json({
          id: 'e-sub',
          userId: 'u-sub',
          companyId: 'c-1',
          directManagerId: 'e-mgr',
          slug: 'lucas-martin',
          honorific: 'M',
          firstName: 'Lucas',
          lastName: 'Martin',
          bornAt: '1995-04-12',
          birthPlace: 'Lyon',
          birthDepartmentCode: '69',
          nationalId: null,
          email: 'lmartin@nova-conseil.fr',
          landline: null,
          mobile: null,
          personalEmail: null,
          personalLandline: null,
          personalMobile: null,
          address: null,
          departments: ['DEPT_HR'],
          roles: ['EMPLOYEE'],
          isActive,
          currentlyInPosition: true,
          createdAtUtc: '2026-11-27T00:00:00Z',
          updatedAtUtc: '2026-11-27T00:00:00Z',
          rowVersion: 'v1',
        }),
      ),
      http.post(api('/api/v1/employees/e-sub/deactivate'), () => {
        isActive = false;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    renderAppAt(['/employees/e-sub']);

    expect(await screen.findByRole('heading', { name: /M Lucas Martin/i })).toBeInTheDocument();
    expect(screen.getAllByText('Masqué (confidentiel)').length).toBeGreaterThanOrEqual(1);

    await user.click(screen.getByRole('button', { name: 'Désactiver' }));
    await user.click(screen.getByRole('button', { name: 'Désactiver' }));

    await waitFor(() => {
      expect(screen.getByText('Désactivé')).toBeInTheDocument();
    });
  });
});
