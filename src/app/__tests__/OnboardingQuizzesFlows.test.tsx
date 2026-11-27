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

function setupSession(permissions: string[], roleCode: string = ROLES.HR) {
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
      HttpResponse.json({ items: [], page: 1, pageSize: 100, totalCount: 0, totalPages: 1 }),
    ),
    http.get(api('/api/v1/employees'), () =>
      HttpResponse.json({
        items: [
          {
            id: 'e-2',
            firstName: 'Camille',
            lastName: 'Dubois',
            email: 'cdubois@nova-conseil.fr',
            slug: 'camille-dubois',
            isActive: true,
            currentlyInPosition: true,
            companyId: 'c-1',
            roles: ['EMPLOYEE'],
            departments: [],
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

describe('OnboardingQuizzesFlows', () => {
  it('saves quiz, surfaces 400 publish validation error without losing state, and shows results tab', async () => {
    setupSession([
      PERMISSIONS.QUIZZES_READ,
      PERMISSIONS.QUIZZES_WRITE,
      PERMISSIONS.QUIZZES_RESULTS_ALL,
      PERMISSIONS.EMPLOYEES_READ_ALL,
    ]);

    let attemptsQuery = '';
    mswServer.use(
      http.get(api('/api/v1/onboarding-quizzes/q-1'), () =>
        HttpResponse.json({
          id: 'q-1',
          companyId: null,
          title: 'Sécurité informatique',
          description: 'Bonnes pratiques',
          passingScorePercent: 80,
          isPublished: false,
          version: 1,
          questions: [
            {
              id: 'qu-1',
              orderIndex: 1,
              questionText: 'Faut-il verrouiller son poste ?',
              questionType: 'singleChoice',
              explanation: 'Toujours verrouiller (Win+L).',
              choices: [
                { id: 'c-1', orderIndex: 1, choiceText: 'Oui', isCorrect: true },
                { id: 'c-2', orderIndex: 2, choiceText: 'Non', isCorrect: false },
              ],
            },
          ],
          createdAtUtc: '2026-11-20T10:00:00Z',
          updatedAtUtc: '2026-11-20T10:00:00Z',
          rowVersion: 'rv-1',
        }),
      ),
      http.patch(api('/api/v1/onboarding-quizzes/q-1/publish'), () =>
        HttpResponse.json(
          {
            status: 400,
            title: 'Quiz.PublishInvalid',
            detail: 'Un QCM publié doit contenir au moins 2 questions.',
          },
          { status: 400 },
        ),
      ),
      http.get(api('/api/v1/onboarding-quizzes/q-1/attempts'), ({ request }) => {
        attemptsQuery = new URL(request.url).search;
        return HttpResponse.json({
          items: [
            {
              attemptId: 'att-1',
              quizId: 'q-1',
              employeeId: 'e-2',
              quizVersion: 1,
              status: 'completed',
              correctAnswersCount: 1,
              totalQuestionsCount: 1,
              scorePercent: 100,
              passed: true,
              startedAtUtc: '2026-11-25T10:00:00Z',
              completedAtUtc: '2026-11-25T10:02:00Z',
            },
          ],
          page: 1,
          pageSize: 20,
          totalCount: 1,
          totalPages: 1,
        });
      }),
    );

    const user = userEvent.setup();
    renderAppAt(['/onboarding-quizzes/q-1/edit']);

    expect(await screen.findByDisplayValue('Sécurité informatique')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Publier' }));
    expect(
      await screen.findByText(/Un QCM publié doit contenir au moins 2 questions/i),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue('Sécurité informatique')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Résultats' }));
    expect(await screen.findAllByText('Camille Dubois')).toHaveLength(2);
    await user.selectOptions(screen.getByLabelText('Filtrer par résultat'), 'true');
    await waitFor(() => expect(attemptsQuery).toContain('passed=true'));
  });

  it('starts an attempt, submits answers, and displays server score and explanations', async () => {
    setupSession([PERMISSIONS.QUIZZES_READ, PERMISSIONS.QUIZZES_TAKE], ROLES.EMPLOYEE);

    mswServer.use(
      http.post(api('/api/v1/onboarding-quizzes/q-1/attempts'), () =>
        HttpResponse.json(
          {
            attemptId: 'att-99',
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
          { status: 201 },
        ),
      ),
      http.post(api('/api/v1/onboarding-quizzes/attempts/att-99/submit'), () =>
        HttpResponse.json({
          attemptId: 'att-99',
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
        }),
      ),
    );

    const user = userEvent.setup();
    renderAppAt(['/onboarding-quizzes/q-1/take']);

    expect(await screen.findByText(/Quelle est la convention collective/i)).toBeInTheDocument();
    await user.click(screen.getByLabelText('Syntec'));
    await user.click(screen.getByRole('button', { name: /Valider mes réponses/i }));

    expect(await screen.findByText('100 %')).toBeInTheDocument();
    expect(screen.getByText('Réussi')).toBeInTheDocument();
    expect(screen.getByText(/Nova Conseil relève de la convention Syntec/i)).toBeInTheDocument();
  });
});
