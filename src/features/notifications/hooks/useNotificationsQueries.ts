import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/shared/auth/AuthContext';
import { notificationsApi } from '../api/notificationsApi';
import type { NotificationsFilter } from '../types/notificationTypes';

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (filter: NotificationsFilter) => [...notificationKeys.all, 'list', filter] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
};

export function useNotificationsQuery(filter: NotificationsFilter, enabled = true) {
  return useQuery({
    queryKey: notificationKeys.list(filter),
    queryFn: () => notificationsApi.getNotifications(filter),
    enabled,
  });
}

export function useUnreadCountQuery(enabled = true, initialCount?: number) {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => notificationsApi.getUnreadCount(),
    initialData: initialCount !== undefined ? { unreadCount: initialCount } : undefined,
    staleTime: 60_000,
    refetchInterval: 60_000,
    enabled,
  });
}

export function useMarkNotificationReadMutation() {
  const qc = useQueryClient();
  const { setUnreadNotificationsCount } = useAuth();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      setUnreadNotificationsCount((prev) => prev - 1);
      return qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllNotificationsReadMutation() {
  const qc = useQueryClient();
  const { setUnreadNotificationsCount } = useAuth();
  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      setUnreadNotificationsCount(0);
      return qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useDeleteNotificationMutation() {
  const qc = useQueryClient();
  const { setUnreadNotificationsCount } = useAuth();
  return useMutation({
    mutationFn: ({ id }: { id: string; wasUnread: boolean }) =>
      notificationsApi.deleteNotification(id),
    onSuccess: (_data, variables) => {
      if (variables.wasUnread) {
        setUnreadNotificationsCount((prev) => prev - 1);
      }
      return qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
