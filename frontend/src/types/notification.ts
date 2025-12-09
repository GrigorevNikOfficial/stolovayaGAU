export type NotificationCategory = 'orders' | 'marketplace' | 'system' | 'chat' | 'balance' | 'topups';
export type NotificationSeverity = 'info' | 'success' | 'warning' | 'danger';

export type NotificationItem = {
  id: string;
  userId?: string;
  title: string;
  body: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  type: string;
  topic?: string | null;
  icon?: string | null;
  actionLabel?: string | null;
  actionUrl?: string | null;
  metadata?: Record<string, unknown> | null;
  read: boolean;
  readAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  muted?: boolean;
  expiresAt?: string | null;
};

export type NotificationFeedMeta = {
  unreadCount: number;
  nextCursor?: string | null;
  hasMore?: boolean;
};

export type NotificationFeedResponse = {
  items: NotificationItem[];
  meta: NotificationFeedMeta;
};

export type NotificationPreferences = {
  categories: Record<NotificationCategory, boolean>;
  channels: Record<'inApp' | 'email' | 'push', boolean>;
  soundEnabled: boolean;
  digestEnabled: boolean;
  quietHours: {
    enabled: boolean;
    from: string;
    to: string;
  };
  mutedUntil?: string | null;
  timezone?: string;
};

export type NotificationSummary = {
  unreadCount: number;
  totalCount: number;
  latest?: NotificationItem | null;
};

export type UpdateNotificationPreferencesPayload = Partial<Omit<NotificationPreferences, 'categories' | 'channels'>> & {
  categories?: Partial<Record<NotificationCategory, boolean>>;
  channels?: Partial<Record<'inApp' | 'email' | 'push', boolean>>;
};
