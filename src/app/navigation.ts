import {
  Bell,
  Building,
  Calculator,
  FileBadge2,
  FileText,
  FolderOpen,
  GraduationCap,
  HeartPulse,
  LayoutDashboard,
  Lightbulb,
  MapPin,
  Scale,
  ScrollText,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import type { NavSection } from '@/app/layout/AppShell';
import { PERMISSIONS, hasAnyPermission } from '@/shared/auth/permissions';

export function buildNavigationSections(
  userPermissions: readonly string[],
  unreadNotificationsCount: number,
): NavSection[] {
  const rawSections: NavSection[] = [
    {
      title: 'Général',
      items: [
        {
          label: 'Tableau de bord',
          to: '/dashboard',
          icon: LayoutDashboard,
        },
        {
          label: 'Mon Espace',
          to: '/me',
          icon: UserCheck,
          requiredPermissions: [PERMISSIONS.EMPLOYEES_READ_SELF],
        },
        {
          label: 'Notifications',
          to: '/notifications',
          icon: Bell,
          requiredPermissions: [PERMISSIONS.NOTIFICATIONS_READ_SELF],
          badgeCount: unreadNotificationsCount,
        },
      ],
    },
    {
      title: 'Gestion RH',
      items: [
        {
          label: 'Collaborateurs',
          to: '/employees',
          icon: Users,
          requiredPermissions: [PERMISSIONS.EMPLOYEES_READ_TEAM, PERMISSIONS.EMPLOYEES_READ_ALL],
        },
        {
          label: 'Contrats',
          to: '/contracts',
          icon: ScrollText,
          requiredPermissions: [PERMISSIONS.CONTRACTS_READ_ALL],
        },
        {
          label: 'Modèles de contrat',
          to: '/contracts/models',
          icon: FileBadge2,
          requiredPermissions: [PERMISSIONS.CONTRACT_MODELS_READ],
        },
        {
          label: 'Dossiers salariés',
          to: '/documents',
          icon: FolderOpen,
          requiredPermissions: [
            PERMISSIONS.EMPLOYEE_DOCS_READ_TEAM,
            PERMISSIONS.EMPLOYEE_DOCS_READ_ALL,
          ],
        },
        {
          label: 'Visites médicales',
          to: '/health/medical-visits',
          icon: HeartPulse,
          requiredPermissions: [PERMISSIONS.MEDICAL_VISITS_READ_ALL],
        },
      ],
    },
    {
      title: 'Vie Interne',
      items: [
        {
          label: 'Documents communs',
          to: '/internal-life/documents',
          icon: FileText,
          requiredPermissions: [PERMISSIONS.COMMON_DOCS_READ],
        },
        {
          label: 'Kits d’accueil',
          to: '/internal-life/welcome-kits',
          icon: FolderOpen,
          requiredPermissions: [PERMISSIONS.WELCOME_KITS_READ],
        },
        {
          label: 'Représentants CSE',
          to: '/internal-life/staff-representatives',
          icon: Scale,
          requiredPermissions: [PERMISSIONS.STAFF_REPS_READ],
        },
        {
          label: 'Boîte à idées RSE',
          to: '/internal-life/rse-ideas',
          icon: Lightbulb,
          requiredPermissions: [PERMISSIONS.RSE_READ_SELF, PERMISSIONS.RSE_READ_ALL],
        },
        {
          label: 'QCM d’intégration',
          to: '/onboarding-quizzes',
          icon: GraduationCap,
          requiredPermissions: [PERMISSIONS.QUIZZES_READ],
        },
      ],
    },
    {
      title: 'Organisation & Accès',
      items: [
        {
          label: 'Entreprises',
          to: '/organization/companies',
          icon: Building,
          requiredPermissions: [PERMISSIONS.COMPANIES_READ],
        },
        {
          label: 'Lieux',
          to: '/organization/locations',
          icon: MapPin,
          requiredPermissions: [PERMISSIONS.LOCATIONS_READ],
        },
        {
          label: 'Types de contrat',
          to: '/organization/contract-types',
          icon: FileText,
          requiredPermissions: [PERMISSIONS.CONTRACT_TYPES_READ],
        },
        {
          label: 'Rôles & Permissions',
          to: '/admin/roles',
          icon: ShieldCheck,
          requiredPermissions: [PERMISSIONS.ROLES_READ],
        },
      ],
    },
    {
      title: 'Outils',
      items: [
        {
          label: 'Estimateur URSSAF',
          to: '/tools/urssaf-estimator',
          icon: Calculator,
        },
      ],
    },
  ];

  return rawSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        item.requiredPermissions
          ? hasAnyPermission(userPermissions, item.requiredPermissions)
          : true,
      ),
    }))
    .filter((section) => section.items.length > 0);
}
