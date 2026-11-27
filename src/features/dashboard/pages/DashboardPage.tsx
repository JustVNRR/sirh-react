import {
  Bell,
  Building,
  FileText,
  GraduationCap,
  HeartPulse,
  Lightbulb,
  ScrollText,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { Link } from 'react-router-dom';
import { PermissionGate, useAuth } from '@/shared/auth/AuthContext';
import { PERMISSIONS, ROLES, hasRole } from '@/shared/auth/permissions';
import {
  Alert,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageHeader,
} from '@/shared/ui';
import { DashboardWidgets } from '../components/DashboardWidgets';

interface ShortcutCardProps {
  title: string;
  description: string;
  to: string;
  icon: ComponentType<{ className?: string }>;
  badge?: string;
}

function ShortcutCard({ title, description, to, icon: Icon, badge }: ShortcutCardProps) {
  return (
    <Link to={to} className="group block">
      <Card className="h-full transition-colors group-hover:border-[var(--primary)]">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-[var(--primary)] dark:bg-indigo-950/60">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          {badge && <Badge variant="primary">{badge}</Badge>}
        </CardHeader>
        <CardContent>
          <CardTitle className="text-base group-hover:text-[var(--primary)]">{title}</CardTitle>
          <CardDescription className="mt-1.5">{description}</CardDescription>
        </CardContent>
      </Card>
    </Link>
  );
}

export function DashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const isRestrictedUnknown = user.permissions.length === 0 || hasRole(user.roles, ROLES.UNKNOWN);

  const unreadPlural = user.unreadNotificationsCount > 1 ? 's' : '';
  const unreadBadge =
    user.unreadNotificationsCount > 0
      ? `${user.unreadNotificationsCount} non lue${unreadPlural}`
      : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tableau de bord"
        description={`Bienvenue, ${user.email}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {user.roles.map((role) => (
              <Badge key={role.id} variant="primary">
                {role.name}
              </Badge>
            ))}
            <Badge variant={user.isActive ? 'success' : 'danger'}>
              {user.isActive ? 'Compte actif' : 'Compte désactivé'}
            </Badge>
          </div>
        }
      />

      {isRestrictedUnknown && (
        <Alert variant="warning" title="Accès restreint">
          Votre compte ne dispose actuellement d&apos;aucune permission métier active. Veuillez
          contacter le service des Ressources Humaines pour finaliser l&apos;attribution de vos
          droits.
        </Alert>
      )}

      {!isRestrictedUnknown && <DashboardWidgets />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <PermissionGate anyOf={[PERMISSIONS.NOTIFICATIONS_READ_SELF]}>
          <ShortcutCard
            title="Notifications"
            description="Consultez vos rappels de visites médicales et alertes d'échéance."
            to="/notifications"
            icon={Bell}
            badge={unreadBadge}
          />
        </PermissionGate>

        <PermissionGate anyOf={[PERMISSIONS.EMPLOYEES_READ_SELF]}>
          <ShortcutCard
            title="Mon Espace"
            description="Accédez à votre fiche personnelle, contacts d'urgence, postes et documents."
            to="/me"
            icon={UserCheck}
          />
        </PermissionGate>

        <PermissionGate anyOf={[PERMISSIONS.EMPLOYEES_READ_TEAM, PERMISSIONS.EMPLOYEES_READ_ALL]}>
          <ShortcutCard
            title="Collaborateurs"
            description="Parcourez l'annuaire, les affectations de postes et les fiches autorisées."
            to="/employees"
            icon={Users}
          />
        </PermissionGate>

        <PermissionGate anyOf={[PERMISSIONS.CONTRACTS_READ_ALL, PERMISSIONS.CONTRACT_MODELS_READ]}>
          <ShortcutCard
            title="Contrats & Modèles"
            description="Gérez les modèles Markdown/Scriban, aperçus PDF et contrats salariés."
            to="/contracts"
            icon={ScrollText}
          />
        </PermissionGate>

        <PermissionGate
          anyOf={[PERMISSIONS.MEDICAL_VISITS_READ_SELF, PERMISSIONS.MEDICAL_VISITS_READ_ALL]}
        >
          <ShortcutCard
            title="Visites médicales"
            description="Suivez les convocations, visites planifiées et rapports médicaux."
            to="/health/medical-visits"
            icon={HeartPulse}
          />
        </PermissionGate>

        <PermissionGate anyOf={[PERMISSIONS.COMMON_DOCS_READ]}>
          <ShortcutCard
            title="Documents communs"
            description="Consultez les accords d'entreprise, documents CSE et kits d'accueil."
            to="/internal-life/documents"
            icon={FileText}
          />
        </PermissionGate>

        <PermissionGate anyOf={[PERMISSIONS.RSE_READ_SELF, PERMISSIONS.RSE_READ_ALL]}>
          <ShortcutCard
            title="Boîte à idées RSE"
            description="Proposez des initiatives RSE et suivez leur avancement."
            to="/internal-life/rse-ideas"
            icon={Lightbulb}
          />
        </PermissionGate>

        <PermissionGate anyOf={[PERMISSIONS.QUIZZES_READ]}>
          <ShortcutCard
            title="QCM d'intégration"
            description="Complétez votre parcours d'onboarding et consultez vos résultats."
            to="/onboarding-quizzes"
            icon={GraduationCap}
          />
        </PermissionGate>

        <PermissionGate anyOf={[PERMISSIONS.COMPANIES_READ]}>
          <ShortcutCard
            title="Organisation"
            description="Consultez les entreprises, lieux d'affectation et types de contrat."
            to="/organization/companies"
            icon={Building}
          />
        </PermissionGate>

        <PermissionGate anyOf={[PERMISSIONS.ROLES_READ]}>
          <ShortcutCard
            title="Rôles & Permissions"
            description="Administrez la matrice des permissions métier par rôle."
            to="/admin/roles"
            icon={ShieldCheck}
          />
        </PermissionGate>
      </div>
    </div>
  );
}
