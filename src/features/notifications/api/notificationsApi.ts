import { httpClient } from '@/shared/api/httpClient';
import type { PagedResult } from '@/shared/api/types';
import type {
  NotificationDto,
  NotificationsFilter,
  UnreadCountDto,
} from '../types/notificationTypes';

function buildQuery(filter: NotificationsFilter): string {
  const sp = new URLSearchParams();
  if (filter.isRead !== undefined) {
    sp.set('isRead', String(filter.isRead));
  }
  if (filter.category) {
    sp.set('category', filter.category);
  }
  sp.set('page', String(filter.page ?? 1));
  sp.set('pageSize', String(filter.pageSize ?? 20));
  return `?${sp.toString()}`;
}

export const notificationsApi = {
  getNotifications: (filter: NotificationsFilter): Promise<PagedResult<NotificationDto>> =>
    httpClient.get<PagedResult<NotificationDto>>(`/api/v1/notifications${buildQuery(filter)}`),

  getUnreadCount: (): Promise<UnreadCountDto> =>
    httpClient.get<UnreadCountDto>('/api/v1/notifications/unread-count'),

  markAsRead: (id: string): Promise<undefined> =>
    httpClient.patch<undefined>(`/api/v1/notifications/${id}/read`),

  markAllAsRead: (): Promise<undefined> =>
    httpClient.post<undefined>('/api/v1/notifications/read-all'),

  deleteNotification: (id: string): Promise<undefined> =>
    httpClient.delete<undefined>(`/api/v1/notifications/${id}`),
};
