import type { BadgeProps } from '@/shared/ui';
import type { NotificationCategory, NotificationDto } from '../types/notificationTypes';

export const NOTIFICATION_CATEGORIES: readonly NotificationCategory[] = [
  'medicalVisitReminder',
  'documentExpiryAlert',
  'rseUpdate',
  'system',
];

export const NOTIFICATION_CATEGORY_LABELS: Record<NotificationCategory, string> = {
  medicalVisitReminder: 'Rappel visite médicale',
  documentExpiryAlert: 'Alerte expiration document',
  rseUpdate: 'Suivi RSE',
  system: 'Système',
};

export const NOTIFICATION_CATEGORY_BADGE: Record<NotificationCategory, BadgeProps['variant']> = {
  medicalVisitReminder: 'warning',
  documentExpiryAlert: 'danger',
  rseUpdate: 'info',
  system: 'neutral',
};

export function getNotificationTargetLink(notification: NotificationDto): string | null {
  switch (notification.category) {
    case 'medicalVisitReminder':
      return '/health/medical-visits';
    case 'documentExpiryAlert':
      return '/documents';
    case 'rseUpdate':
      return '/internal-life/rse-ideas';
    default:
      return null;
  }
}
