import { Navigate, createBrowserRouter, type RouteObject } from 'react-router-dom';
import {
  AccountSecurityPage,
  ForgotPasswordPage,
  LoginPage,
  ResetPasswordPage,
} from '@/features/auth';
import { DashboardPage } from '@/features/dashboard';
import { CompaniesPage, ContractTypesPage, LocationsPage } from '@/features/organization';
import { PERMISSIONS } from '@/shared/auth/permissions';
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
                  <ModulePlannedPage title="Rôles & Permissions" sprint="Sprint 1" />
                </RequirePermission>
              ),
            },

            // Sprint 2
            {
              path: '/me',
              element: (
                <RequirePermission anyOf={[PERMISSIONS.EMPLOYEES_READ_SELF]}>
                  <ModulePlannedPage title="Mon Espace" sprint="Sprint 2" />
                </RequirePermission>
              ),
            },
            {
              path: '/employees',
              element: (
                <RequirePermission
                  anyOf={[PERMISSIONS.EMPLOYEES_READ_TEAM, PERMISSIONS.EMPLOYEES_READ_ALL]}
                >
                  <ModulePlannedPage title="Collaborateurs" sprint="Sprint 2" />
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
                  <ModulePlannedPage title="Contrats" sprint="Sprint 3" />
                </RequirePermission>
              ),
            },
            {
              path: '/contracts/models',
              element: (
                <RequirePermission anyOf={[PERMISSIONS.CONTRACT_MODELS_READ]}>
                  <ModulePlannedPage title="Modèles de contrat" sprint="Sprint 3" />
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
                  <ModulePlannedPage title="Dossiers salariés" sprint="Sprint 3" />
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
                  <ModulePlannedPage title="Visites médicales" sprint="Sprint 4" />
                </RequirePermission>
              ),
            },
            {
              path: '/notifications',
              element: (
                <RequirePermission anyOf={[PERMISSIONS.NOTIFICATIONS_READ_SELF]}>
                  <ModulePlannedPage title="Centre de notifications" sprint="Sprint 4" />
                </RequirePermission>
              ),
            },

            // Sprint 5
            {
              path: '/internal-life/documents',
              element: (
                <RequirePermission anyOf={[PERMISSIONS.COMMON_DOCS_READ]}>
                  <ModulePlannedPage title="Documents communs" sprint="Sprint 5" />
                </RequirePermission>
              ),
            },
            {
              path: '/internal-life/welcome-kits',
              element: (
                <RequirePermission anyOf={[PERMISSIONS.WELCOME_KITS_READ]}>
                  <ModulePlannedPage title="Kits d'accueil" sprint="Sprint 5" />
                </RequirePermission>
              ),
            },
            {
              path: '/internal-life/staff-representatives',
              element: (
                <RequirePermission anyOf={[PERMISSIONS.STAFF_REPS_READ]}>
                  <ModulePlannedPage title="Représentants du personnel (CSE)" sprint="Sprint 5" />
                </RequirePermission>
              ),
            },
            {
              path: '/internal-life/rse-ideas',
              element: (
                <RequirePermission anyOf={[PERMISSIONS.RSE_READ_SELF, PERMISSIONS.RSE_READ_ALL]}>
                  <ModulePlannedPage title="Boîte à idées RSE" sprint="Sprint 5" />
                </RequirePermission>
              ),
            },

            // Sprint 6
            {
              path: '/onboarding-quizzes',
              element: (
                <RequirePermission anyOf={[PERMISSIONS.QUIZZES_READ]}>
                  <ModulePlannedPage title="QCM d'intégration" sprint="Sprint 6" />
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
