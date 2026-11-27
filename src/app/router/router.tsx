import { Navigate, createBrowserRouter, type RouteObject } from 'react-router-dom';
import {
  AccountSecurityPage,
  ForgotPasswordPage,
  LoginPage,
  ResetPasswordPage,
} from '@/features/auth';
import { ContractModelsPage, ContractModelStudioPage, ContractsPage } from '@/features/contracts';
import { DashboardPage } from '@/features/dashboard';
import { EmployeeDocumentsPage } from '@/features/employee-documents';
import { EmployeeFormPage, EmployeesDirectoryPage } from '@/features/employees';
import { MedicalVisitsPage } from '@/features/health';
import {
  CommonDocumentsPage,
  RseIdeasPage,
  StaffRepresentativesPage,
  WelcomeKitsPage,
} from '@/features/internal-life';
import { NotificationsPage } from '@/features/notifications';
import {
  OnboardingQuizzesPage,
  QuizBuilderPage,
  QuizPlayerPage,
} from '@/features/onboarding-quizzes';
import { CompaniesPage, ContractTypesPage, LocationsPage } from '@/features/organization';
import { RolesPermissionsPage } from '@/features/roles';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { EmployeeProfilePage, MyProfilePage } from '../pages/EmployeeWorkspacePages';
import { ForbiddenPage } from '../pages/ForbiddenPage';
import { ModulePlannedPage } from '../pages/ModulePlannedPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { GuestOnly, RequireAuth, RequirePermission } from './guards';
import { AuthLayoutRoute, ProtectedAppLayout } from './layouts';

export function createAppRoutes(): RouteObject[] {
  return [
    {
      element: <GuestOnly />,
      children: [
        {
          element: <AuthLayoutRoute />,
          children: [
            { path: '/login', element: <LoginPage /> },
            { path: '/forgot-password', element: <ForgotPasswordPage /> },
            { path: '/reset-password', element: <ResetPasswordPage /> },
          ],
        },
      ],
    },
    {
      element: <RequireAuth />,
      children: [
        {
          element: <ProtectedAppLayout />,
          children: [
            { index: true, element: <Navigate to="/dashboard" replace /> },
            { path: '/dashboard', element: <DashboardPage /> },
            { path: '/account/security', element: <AccountSecurityPage /> },
            { path: '/403', element: <ForbiddenPage /> },

            // Sprint 1
            {
              path: '/organization/companies',
              element: (
                <RequirePermission anyOf={[PERMISSIONS.COMPANIES_READ]}>
                  <CompaniesPage />
                </RequirePermission>
              ),
            },
            {
              path: '/organization/locations',
              element: (
                <RequirePermission anyOf={[PERMISSIONS.LOCATIONS_READ]}>
                  <LocationsPage />
                </RequirePermission>
              ),
            },
            {
              path: '/organization/contract-types',
              element: (
                <RequirePermission anyOf={[PERMISSIONS.CONTRACT_TYPES_READ]}>
                  <ContractTypesPage />
                </RequirePermission>
              ),
            },
            {
              path: '/admin/roles',
              element: (
                <RequirePermission anyOf={[PERMISSIONS.ROLES_READ]}>
                  <RolesPermissionsPage />
                </RequirePermission>
              ),
            },

            // Sprint 2
            {
              path: '/me',
              element: (
                <RequirePermission anyOf={[PERMISSIONS.EMPLOYEES_READ_SELF]}>
                  <MyProfilePage />
                </RequirePermission>
              ),
            },
            {
              path: '/employees',
              element: (
                <RequirePermission
                  anyOf={[PERMISSIONS.EMPLOYEES_READ_TEAM, PERMISSIONS.EMPLOYEES_READ_ALL]}
                >
                  <EmployeesDirectoryPage />
                </RequirePermission>
              ),
            },
            {
              path: '/employees/new',
              element: (
                <RequirePermission anyOf={[PERMISSIONS.EMPLOYEES_WRITE]}>
                  <EmployeeFormPage />
                </RequirePermission>
              ),
            },
            {
              path: '/employees/:id',
              element: (
                <RequirePermission
                  anyOf={[
                    PERMISSIONS.EMPLOYEES_READ_SELF,
                    PERMISSIONS.EMPLOYEES_READ_TEAM,
                    PERMISSIONS.EMPLOYEES_READ_ALL,
                  ]}
                >
                  <EmployeeProfilePage />
                </RequirePermission>
              ),
            },
            {
              path: '/employees/:id/edit',
              element: (
                <RequirePermission anyOf={[PERMISSIONS.EMPLOYEES_WRITE]}>
                  <EmployeeFormPage />
                </RequirePermission>
              ),
            },

            // Sprint 3
            {
              path: '/contracts',
              element: (
                <RequirePermission
                  anyOf={[PERMISSIONS.CONTRACTS_READ_SELF, PERMISSIONS.CONTRACTS_READ_ALL]}
                >
                  <ContractsPage />
                </RequirePermission>
              ),
            },
            {
              path: '/contracts/models',
              element: (
                <RequirePermission anyOf={[PERMISSIONS.CONTRACT_MODELS_READ]}>
                  <ContractModelsPage />
                </RequirePermission>
              ),
            },
            {
              path: '/contracts/models/new',
              element: (
                <RequirePermission anyOf={[PERMISSIONS.CONTRACT_MODELS_WRITE]}>
                  <ContractModelStudioPage />
                </RequirePermission>
              ),
            },
            {
              path: '/contracts/models/:id',
              element: (
                <RequirePermission anyOf={[PERMISSIONS.CONTRACT_MODELS_READ]}>
                  <ContractModelStudioPage />
                </RequirePermission>
              ),
            },
            {
              path: '/documents',
              element: (
                <RequirePermission
                  anyOf={[
                    PERMISSIONS.EMPLOYEE_DOCS_READ_SELF,
                    PERMISSIONS.EMPLOYEE_DOCS_READ_TEAM,
                    PERMISSIONS.EMPLOYEE_DOCS_READ_ALL,
                  ]}
                >
                  <EmployeeDocumentsPage />
                </RequirePermission>
              ),
            },

            // Sprint 4
            {
              path: '/health/medical-visits',
              element: (
                <RequirePermission
                  anyOf={[
                    PERMISSIONS.MEDICAL_VISITS_READ_SELF,
                    PERMISSIONS.MEDICAL_VISITS_READ_ALL,
                  ]}
                >
                  <MedicalVisitsPage />
                </RequirePermission>
              ),
            },
            {
              path: '/notifications',
              element: (
                <RequirePermission anyOf={[PERMISSIONS.NOTIFICATIONS_READ_SELF]}>
                  <NotificationsPage />
                </RequirePermission>
              ),
            },

            // Sprint 5
            {
              path: '/internal-life/documents',
              element: (
                <RequirePermission anyOf={[PERMISSIONS.COMMON_DOCS_READ]}>
                  <CommonDocumentsPage />
                </RequirePermission>
              ),
            },
            {
              path: '/internal-life/welcome-kits',
              element: (
                <RequirePermission anyOf={[PERMISSIONS.WELCOME_KITS_READ]}>
                  <WelcomeKitsPage />
                </RequirePermission>
              ),
            },
            {
              path: '/internal-life/staff-representatives',
              element: (
                <RequirePermission anyOf={[PERMISSIONS.STAFF_REPS_READ]}>
                  <StaffRepresentativesPage />
                </RequirePermission>
              ),
            },
            {
              path: '/internal-life/rse-ideas',
              element: (
                <RequirePermission anyOf={[PERMISSIONS.RSE_READ_SELF, PERMISSIONS.RSE_READ_ALL]}>
                  <RseIdeasPage />
                </RequirePermission>
              ),
            },

            // Sprint 6
            {
              path: '/onboarding-quizzes',
              element: (
                <RequirePermission anyOf={[PERMISSIONS.QUIZZES_READ]}>
                  <OnboardingQuizzesPage />
                </RequirePermission>
              ),
            },
            {
              path: '/onboarding-quizzes/new',
              element: (
                <RequirePermission anyOf={[PERMISSIONS.QUIZZES_WRITE]}>
                  <QuizBuilderPage />
                </RequirePermission>
              ),
            },
            {
              path: '/onboarding-quizzes/:id/edit',
              element: (
                <RequirePermission
                  anyOf={[PERMISSIONS.QUIZZES_WRITE, PERMISSIONS.QUIZZES_RESULTS_ALL]}
                >
                  <QuizBuilderPage />
                </RequirePermission>
              ),
            },
            {
              path: '/onboarding-quizzes/:id/take',
              element: (
                <RequirePermission anyOf={[PERMISSIONS.QUIZZES_TAKE]}>
                  <QuizPlayerPage />
                </RequirePermission>
              ),
            },
            {
              path: '/tools/urssaf-estimator',
              element: <ModulePlannedPage title="Estimateur URSSAF" sprint="Sprint 6" />,
            },

            { path: '*', element: <NotFoundPage /> },
          ],
        },
      ],
    },
  ];
}

export const appRouter = createBrowserRouter(createAppRoutes());
