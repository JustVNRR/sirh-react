import { useQuery } from '@tanstack/react-query';
import { Bell, HeartPulse, Lightbulb, Users } from 'lucide-react';
import type { ComponentType } from 'react';
import { Link } from 'react-router-dom';
import { useEmployeesQuery } from '@/features/employees';
import { MEDICAL_VISIT_TYPE_LABELS, useMedicalVisitsQuery } from '@/features/health';
import { NOTIFICATION_CATEGORY_LABELS, useNotificationsQuery } from '@/features/notifications';
import { useAuth, usePermission } from '@/shared/auth/AuthContext';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { formatDateTimeFr } from '@/shared/lib/format';
import { Badge, Card, CardContent, CardHeader, CardTitle, Spinner } from '@/shared/ui';
import { dashboardApi } from '../api/dashboardApi';

function KpiCard({
  title,
  value,
  to,
  icon: Icon,
  isLoading,
}: {
  title: string;
  value: number;
  to: string;
  icon: ComponentType<{ className?: string }>;
  isLoading?: boolean;
}) {
  return (
    <Link to={to} className="group block">
      <Card className="transition-colors group-hover:border-[var(--primary)]">
        <CardContent className="flex items-center justify-between p-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
              {title}
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--foreground)]">
              {isLoading ? '—' : value}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-[var(--primary)] dark:bg-indigo-950/60">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function DashboardWidgets() {
  const { user } = useAuth();
  const { can, canAny } = usePermission();

  const canReadNotifications = can(PERMISSIONS.NOTIFICATIONS_READ_SELF);
  const canReadVisits = canAny([
    PERMISSIONS.MEDICAL_VISITS_READ_SELF,
    PERMISSIONS.MEDICAL_VISITS_READ_ALL,
  ]);
  const canReadEmployeesAll = can(PERMISSIONS.EMPLOYEES_READ_ALL);
  const canReadEmployees = canAny([
    PERMISSIONS.EMPLOYEES_READ_TEAM,
    PERMISSIONS.EMPLOYEES_READ_ALL,
  ]);
  const canReadPendingRse = can(PERMISSIONS.RSE_READ_ALL);

  const notificationsQuery = useNotificationsQuery(
    { isRead: false, page: 1, pageSize: 5 },
    canReadNotifications,
  );
  const visitsQuery = useMedicalVisitsQuery(
    { carriedOut: false, page: 1, pageSize: 5 },
    canReadVisits,
  );
  const employeesQuery = useEmployeesQuery(
    { active: true, page: 1, pageSize: 1 },
    canReadEmployees,
  );
  const pendingRseQuery = useQuery({
    queryKey: ['dashboard', 'pending-rse-count'],
    queryFn: () => dashboardApi.getPendingRseIdeasCount(),
    enabled: canReadPendingRse,
  });

  if (!canReadNotifications && !canReadVisits && !canReadEmployees && !canReadPendingRse) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {canReadNotifications && (
          <KpiCard
            title="Notifications non lues"
            value={user?.unreadNotificationsCount ?? 0}
            to="/notifications"
            icon={Bell}
          />
        )}
        {canReadVisits && (
          <KpiCard
            title="Visites à venir"
            value={visitsQuery.data?.totalCount ?? 0}
            to="/health/medical-visits"
            icon={HeartPulse}
            isLoading={visitsQuery.isLoading}
          />
        )}
        {canReadEmployees && (
          <KpiCard
            title={canReadEmployeesAll ? 'Collaborateurs actifs' : 'Effectif équipe'}
            value={employeesQuery.data?.totalCount ?? 0}
            to="/employees"
            icon={Users}
            isLoading={employeesQuery.isLoading}
          />
        )}
        {canReadPendingRse && (
          <KpiCard
            title="Idées RSE en attente"
            value={pendingRseQuery.data ?? 0}
            to="/internal-life/rse-ideas"
            icon={Lightbulb}
            isLoading={pendingRseQuery.isLoading}
          />
        )}
      </div>

      {(canReadNotifications || canReadVisits) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {canReadNotifications && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-base">Notifications récentes</CardTitle>
                <Link
                  to="/notifications"
                  className="text-xs font-medium text-[var(--primary)] hover:underline"
                >
                  Tout voir
                </Link>
              </CardHeader>
              <CardContent>
                {notificationsQuery.isLoading && <Spinner label="Chargement..." />}
                {!notificationsQuery.isLoading &&
                  (notificationsQuery.data?.items.length ?? 0) === 0 && (
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Aucune notification non lue.
                    </p>
                  )}
                <ul className="divide-y divide-[var(--border)]">
                  {(notificationsQuery.data?.items ?? []).map((n) => (
                    <li key={n.id} className="py-2.5 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-[var(--foreground)]">
                          {n.subject}
                        </p>
                        <Badge variant="neutral">{NOTIFICATION_CATEGORY_LABELS[n.category]}</Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                        {formatDateTimeFr(n.createdAtUtc)}
                      </p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {canReadVisits && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-base">Prochaines visites médicales</CardTitle>
                <Link
                  to="/health/medical-visits"
                  className="text-xs font-medium text-[var(--primary)] hover:underline"
                >
                  Tout voir
                </Link>
              </CardHeader>
              <CardContent>
                {visitsQuery.isLoading && <Spinner label="Chargement..." />}
                {!visitsQuery.isLoading && (visitsQuery.data?.items.length ?? 0) === 0 && (
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Aucune visite médicale planifiée.
                  </p>
                )}
                <ul className="divide-y divide-[var(--border)]">
                  {(visitsQuery.data?.items ?? []).map((v) => (
                    <li key={v.id} className="py-2.5 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-[var(--foreground)]">
                          {MEDICAL_VISIT_TYPE_LABELS[v.visitType]}
                        </p>
                        <Badge variant="warning">Planifiée</Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                        {formatDateTimeFr(v.visitDateTimeUtc)}
                        {v.medicalCenter ? ` · ${v.medicalCenter}` : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
