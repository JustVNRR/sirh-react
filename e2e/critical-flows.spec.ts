import { expect, test, type Page, type Route } from '@playwright/test';

const ALL_HR_PERMISSIONS = [
  'employees:read:self',
  'employees:read:all',
  'employees:write',
  'contract-models:read',
  'contract-models:write',
  'contracts:read:all',
  'contracts:write',
  'contract-types:read',
  'employee-docs:read:all',
  'employee-docs:read:sensitive',
  'employee-docs:write:all',
  'medical-visits:read:all',
  'notifications:read:self',
  'notifications:write:self',
  'rse:read:all',
  'quizzes:read',
  'quizzes:write',
  'quizzes:take',
  'quizzes:results:all',
  'companies:read',
];

function jsonRoute(route: Route, data: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(data),
  });
}

const STATIC_JSON_ROUTES: Record<string, { status?: number; body: unknown }> = {
  '/api/v1/auth/login': {
    body: {
      accessToken: 'e2e-jwt',
      accessTokenExpiresAtUtc: '2026-11-28T00:00:00Z',
      refreshToken: 'e2e-refresh',
      refreshTokenExpiresAtUtc: '2026-12-05T00:00:00Z',
      tokenType: 'Bearer',
    },
  },
  '/api/v1/auth/refresh': {
    body: {
      accessToken: 'e2e-jwt',
      accessTokenExpiresAtUtc: '2026-11-28T00:00:00Z',
      refreshToken: 'e2e-refresh',
      refreshTokenExpiresAtUtc: '2026-12-05T00:00:00Z',
      tokenType: 'Bearer',
    },
  },
  '/api/v1/employees': {
    body: {
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
          roles: ['HR'],
          departments: ['75'],
        },
      ],
      page: 1,
      pageSize: 20,
      totalCount: 1,
      totalPages: 1,
    },
  },
  '/api/v1/employees/e-1/positions': {
    body: [
      {
        id: 'pos-1',
        employeeId: 'e-1',
        companyId: 'c-1',
        locationId: null,
        managerId: null,
        jobTitle: 'DRH',
        hierarchicalPosition: 'Cadre',
        startAt: '2025-01-01',
        endAt: null,
        isCurrent: true,
        timeContractType: 'Days',
        timeContractAmount: 218,
        coefficient: null,
        salary: null,
        rowVersion: '1',
      },
    ],
  },
  '/api/v1/companies': {
    body: {
      items: [{ id: 'c-1', name: 'Nova Conseil', siret: '12345678901234', isActive: true }],
      page: 1,
      pageSize: 100,
      totalCount: 1,
      totalPages: 1,
    },
  },
  '/api/v1/contract-types': {
    body: {
      items: [{ id: 'ct-cdi', code: 'CDI', label: 'CDI', isSystem: true, rowVersion: '1' }],
      page: 1,
      pageSize: 100,
      totalCount: 1,
      totalPages: 1,
    },
  },
  '/api/v1/referentials/departments': { body: [] },
  '/api/v1/roles': { body: [] },
  '/api/v1/contract-models/variables': {
    body: [{ key: 'employee.full_name', category: 'employee', description: 'Nom complet' }],
  },
  '/api/v1/contract-models/m-1': {
    body: {
      id: 'm-1',
      title: 'CDI Cadre Syntec',
      description: 'Modèle standard',
      contractTypeId: 'ct-cdi',
      templateContent: '# Contrat de travail',
      customVariables: [],
      isActive: true,
      createdAtUtc: '2026-11-01T10:00:00Z',
      updatedAtUtc: '2026-11-01T10:00:00Z',
      rowVersion: '1',
    },
  },
  '/api/v1/employee-documents': {
    body: {
      items: [
        {
          id: 'doc-1',
          employeeId: 'e-1',
          category: 'personalFile',
          documentType: 'rqthCertificate',
          fileName: 'rqth.pdf',
          contentType: 'application/pdf',
          fileSizeBytes: 12000,
          fileDate: '2026-01-01',
          commentary: null,
          rqthDetails: {
            expiryDate: '2026-01-02',
            workplaceAccommodation: 'Poste adapté',
            expiryReminder30SentAtUtc: null,
            expiryReminder7SentAtUtc: null,
          },
          residentPermitDetails: null,
          createdAtUtc: '2026-01-01T10:00:00Z',
          updatedAtUtc: '2026-01-01T10:00:00Z',
          rowVersion: '1',
        },
      ],
      page: 1,
      pageSize: 20,
      totalCount: 1,
      totalPages: 1,
    },
  },
  '/api/v1/onboarding-quizzes/q-1/attempts': {
    status: 201,
    body: {
      attemptId: 'att-1',
      quizId: 'q-1',
      quizTitle: 'Onboarding Culture',
      quizVersion: 1,
      passingScorePercent: 50,
      startedAtUtc: '2026-11-27T10:00:00Z',
      questions: [
        {
          id: 'qu-1',
          orderIndex: 1,
          questionText: 'Quelle est la convention collective ?',
          questionType: 'singleChoice',
          choices: [
            { id: 'ch-1', orderIndex: 1, choiceText: 'Syntec' },
            { id: 'ch-2', orderIndex: 2, choiceText: 'Métallurgie' },
          ],
        },
      ],
    },
  },
  '/api/v1/onboarding-quizzes/attempts/att-1/submit': {
    body: {
      attemptId: 'att-1',
      quizId: 'q-1',
      employeeId: 'e-1',
      quizVersion: 1,
      status: 'completed',
      correctAnswersCount: 1,
      totalQuestionsCount: 1,
      scorePercent: 100,
      passed: true,
      startedAtUtc: '2026-11-27T10:00:00Z',
      completedAtUtc: '2026-11-27T10:01:00Z',
      corrections: [
        {
          questionId: 'qu-1',
          questionText: 'Quelle est la convention collective ?',
          selectedChoiceIds: ['ch-1'],
          correctChoiceIds: ['ch-1'],
          isCorrect: true,
          explanation: 'Nova Conseil relève de la convention Syntec.',
        },
      ],
    },
  },
};

async function mockSirhApi(page: Page) {
  let unreadCount = 2;

  await page.route('**/api/v1/**', async (route) => {
    const req = route.request();
    const pathname = new URL(req.url()).pathname;

    if (pathname === '/api/v1/auth/me') {
      await jsonRoute(route, {
        userId: 'u-hr',
        employeeId: 'e-1',
        email: 'admin.rh@nova-conseil.fr',
        isActive: true,
        maxRolePriority: 5,
        roles: [{ id: 'r-hr', code: 'HR', name: 'RH', priority: 5 }],
        permissions: ALL_HR_PERMISSIONS,
        unreadNotificationsCount: unreadCount,
      });
      return;
    }

    if (pathname === '/api/v1/notifications') {
      await jsonRoute(route, {
        items: [
          {
            id: 'n-1',
            recipientEmployeeId: 'e-1',
            category: 'medicalVisitReminder',
            referenceEntity: 'MedicalVisit',
            referenceId: 'mv-1',
            subject: 'Visite médicale planifiée',
            content: 'Rendez-vous le 05/12/2026.',
            isRead: unreadCount === 0,
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
      return;
    }

    if (pathname === '/api/v1/notifications/read-all' && req.method() === 'POST') {
      unreadCount = 0;
      await route.fulfill({ status: 204 });
      return;
    }

    if (pathname === '/api/v1/contract-models/m-1/preview') {
      await route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        headers: { 'Content-Disposition': 'inline; filename="apercu-cdi.pdf"' },
        body: '%PDF-1.4',
      });
      return;
    }

    const staticMatch = STATIC_JSON_ROUTES[pathname];
    if (staticMatch) {
      await jsonRoute(route, staticMatch.body, staticMatch.status ?? 200);
      return;
    }

    await jsonRoute(route, { items: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 1 });
  });
}

test('critical multi-module journeys work end-to-end in Chromium', async ({ page }) => {
  await mockSirhApi(page);

  await page.goto('/login');
  await page.getByLabel(/Email professionnel/i).fill('admin.rh@nova-conseil.fr');
  await page.getByLabel(/^Mot de passe/i).fill(['Sirh', 'Demo', '123!'].join(''));
  await page.getByRole('button', { name: /Se connecter/i }).click();
  await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible();

  await page.getByRole('link', { name: 'Collaborateurs' }).first().click();
  await expect(page.getByText('Camille Dubois')).toBeVisible();

  await page.goto('/contracts/models/m-1');
  await page.getByRole('button', { name: 'employee.full_name' }).click();
  await expect(page.getByLabel(/Contenu Markdown \/ Scriban/i)).toHaveValue(
    /\{\{ employee\.full_name \}\}/,
  );
  await page.getByLabel('Collaborateur').selectOption('e-1');
  await page.getByLabel('Poste cible').selectOption('pos-1');
  await page.getByRole('button', { name: /Prévisualiser le PDF/i }).click();
  await expect(page.getByText(/Aperçu — CDI Cadre Syntec/i)).toBeVisible();
  await page.keyboard.press('Escape');

  await page.goto('/documents');
  await expect(page.getByText(/Expiré/i)).toBeVisible();
  await expect(page.getByText(/Aménagement : Poste adapté/i)).toBeVisible();

  await page.goto('/notifications');
  await expect(page.getByText('Visite médicale planifiée')).toBeVisible();
  await page.getByRole('button', { name: /Tout marquer comme lu/i }).click();
  await expect(page.getByLabel('Notifications (0 non lues)')).toBeVisible();

  await page.goto('/onboarding-quizzes/q-1/take');
  await page.getByLabel('Syntec').check();
  await page.getByRole('button', { name: /Valider mes réponses/i }).click();
  await expect(page.getByText('100 %')).toBeVisible();
  await expect(page.getByText('Réussi', { exact: true })).toBeVisible();

  await page.goto('/tools/urssaf-estimator');
  await expect(page.getByTitle('Simulateur de cotisations URSSAF')).toBeVisible();
  await expect(page.getByRole('link', { name: /Accéder à eDocPerso/i })).toHaveAttribute(
    'rel',
    'noopener noreferrer',
  );
});
