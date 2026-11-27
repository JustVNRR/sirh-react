import {
  Bell,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ApiError } from '@/shared/api/types';
import { useAuth, usePermission } from '@/shared/auth/AuthContext';
import { PERMISSIONS } from '@/shared/auth/permissions';
import { cn } from '@/shared/lib/cn';
import { formatDateTimeFr } from '@/shared/lib/format';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  ConfirmDialog,
  EmptyState,
  PageHeader,
  Select,
  Spinner,
} from '@/shared/ui';
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_CATEGORY_BADGE,
  NOTIFICATION_CATEGORY_LABELS,
  getNotificationTargetLink,
} from '../constants/notificationConstants';
import {
  useDeleteNotificationMutation,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from '../hooks/useNotificationsQueries';
import type { NotificationCategory, NotificationDto } from '../types/notificationTypes';

function NotificationCard({
  item,
  canWrite,
  onMarkRead,
  onDelete,
}: {
  item: NotificationDto;
  canWrite: boolean;
  onMarkRead: (id: string) => void;
  onDelete: (item: NotificationDto) => void;
}) {
  const targetLink = getNotificationTargetLink(item);
  return (
    <Card
      className={cn(
        'transition-colors',
        !item.isRead &&
          'border-l-4 border-l-[var(--primary)] bg-indigo-50/30 dark:bg-indigo-950/15',
      )}
    >
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={NOTIFICATION_CATEGORY_BADGE[item.category]}>
              {NOTIFICATION_CATEGORY_LABELS[item.category]}
            </Badge>
            {!item.isRead && <Badge variant="primary">Non lue</Badge>}
            <span className="text-xs text-[var(--muted-foreground)]">
              {formatDateTimeFr(item.createdAtUtc)}
            </span>
          </div>
          <p className="font-semibold text-[var(--foreground)]">{item.subject}</p>
          <p className="text-sm text-[var(--muted-foreground)]">{item.content}</p>
          {targetLink && (
            <Link
              to={targetLink}
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--primary)] hover:underline"
            >
              Ouvrir le module associé
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </Link>
          )}
        </div>

        {canWrite && (
          <div className="flex shrink-0 items-center gap-1">
            {!item.isRead && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onMarkRead(item.id)}
                aria-label={`Marquer comme lue : ${item.subject}`}
              >
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                Marquer lue
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Supprimer la notification : ${item.subject}`}
              onClick={() => onDelete(item)}
            >
              <Trash2 className="h-4 w-4 text-[var(--danger)]" aria-hidden="true" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function NotificationsPage() {
  const { user } = useAuth();
  const { can } = usePermission();
  const canWrite = can(PERMISSIONS.NOTIFICATIONS_WRITE_SELF);

  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [category, setCategory] = useState<NotificationCategory | ''>('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<NotificationDto | null>(null);

  let isReadParam: boolean | undefined;
  if (readFilter === 'unread') {
    isReadParam = false;
  } else if (readFilter === 'read') {
    isReadParam = true;
  }

  const notificationsQuery = useNotificationsQuery({
    isRead: isReadParam,
    category: category || undefined,
    page,
    pageSize: 20,
  });
  const markReadMutation = useMarkNotificationReadMutation();
  const markAllMutation = useMarkAllNotificationsReadMutation();
  const deleteMutation = useDeleteNotificationMutation();

  const items = notificationsQuery.data?.items ?? [];
  const totalCount = notificationsQuery.data?.totalCount ?? 0;
  const totalPages = notificationsQuery.data?.totalPages ?? 1;
  const hasUnread = (user?.unreadNotificationsCount ?? 0) > 0 || items.some((n) => !n.isRead);

  const handleMarkRead = async (id: string) => {
    try {
      await markReadMutation.mutateAsync(id);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : 'Impossible de marquer comme lue.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllMutation.mutateAsync();
      toast.success('Toutes les notifications ont été marquées comme lues.');
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.detail : 'Impossible de tout marquer comme lu.',
      );
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    try {
      await deleteMutation.mutateAsync({
        id: deleteTarget.id,
        wasUnread: !deleteTarget.isRead,
      });
      toast.success('Notification supprimée.');
      setDeleteTarget(null);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.detail : 'Impossible de supprimer la notification.',
      );
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Centre de notifications"
        description="Rappels de visites médicales, alertes d’échéance documentaire et notifications système."
        actions={
          canWrite && (
            <Button
              variant="outline"
              disabled={!hasUnread}
              isLoading={markAllMutation.isPending}
              onClick={() => {
                handleMarkAllRead().catch(() => undefined);
              }}
            >
              <CheckCheck className="h-4 w-4" aria-hidden="true" />
              Tout marquer comme lu
            </Button>
          )
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 md:max-w-xl">
        <Select
          aria-label="Filtrer par statut de lecture"
          value={readFilter}
          onChange={(e) => {
            setReadFilter(e.target.value as 'all' | 'unread' | 'read');
            setPage(1);
          }}
        >
          <option value="all">Toutes les notifications</option>
          <option value="unread">Non lues uniquement</option>
          <option value="read">Lues uniquement</option>
        </Select>

        <Select
          aria-label="Filtrer par catégorie"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value as NotificationCategory | '');
            setPage(1);
          }}
        >
          <option value="">Toutes les catégories</option>
          {NOTIFICATION_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {NOTIFICATION_CATEGORY_LABELS[cat]}
            </option>
          ))}
        </Select>
      </div>

      {notificationsQuery.isLoading && <Spinner label="Chargement des notifications..." />}

      {notificationsQuery.error && (
        <Alert variant="danger" title="Erreur">
          {notificationsQuery.error instanceof ApiError
            ? notificationsQuery.error.detail
            : 'Impossible de charger vos notifications.'}
        </Alert>
      )}

      {!notificationsQuery.isLoading && !notificationsQuery.error && items.length === 0 && (
        <EmptyState
          icon={<Bell className="h-6 w-6" aria-hidden="true" />}
          title="Aucune notification"
          description="Vous êtes à jour : aucune notification ne correspond à ces filtres."
        />
      )}

      {items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => (
            <NotificationCard
              key={item.id}
              item={item}
              canWrite={canWrite}
              onMarkRead={(id) => {
                handleMarkRead(id).catch(() => undefined);
              }}
              onDelete={setDeleteTarget}
            />
          ))}

          <div className="flex items-center justify-between pt-2 text-sm text-[var(--muted-foreground)]">
            <p className="tabular-nums">
              Page {page} sur {Math.max(1, totalPages)} — {totalCount} notification
              {totalCount > 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Suivant
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title="Supprimer cette notification ?"
        description="Cette notification sera retirée de votre centre de notifications."
        confirmLabel="Supprimer"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => void handleConfirmDelete()}
      />
    </div>
  );
}
