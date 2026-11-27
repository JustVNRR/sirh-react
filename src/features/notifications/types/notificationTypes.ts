export type NotificationCategory =
  'medicalVisitReminder' | 'documentExpiryAlert' | 'rseUpdate' | 'system';

export interface NotificationDto {
  id: string;
  recipientEmployeeId: string;
  category: NotificationCategory;
  referenceEntity: string | null;
  referenceId: string | null;
  subject: string;
  content: string;
  isRead: boolean;
  readAtUtc: string | null;
  emailSent: boolean;
  createdAtUtc: string;
}

export interface UnreadCountDto {
  unreadCount: number;
}

export interface NotificationsFilter {
  isRead?: boolean;
  category?: NotificationCategory;
  page?: number;
  pageSize?: number;
}
