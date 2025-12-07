import {
  combine,
  createEffect,
  createEvent,
  createStore,
  sample,
} from 'effector';
import { notificationsApi } from '../api/notifications';
import { showToast } from '../components/layout/Toast/stores/toastStore.ts';
import { onSocketEvent } from '../lib/socket';
import type {
  NotificationFeedMeta,
  NotificationItem,
  NotificationPreferences,
  UpdateNotificationPreferencesPayload,
} from '../types/notification';
import type { User } from '../types/user';
import { $currentUser } from './users';

const fallbackId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const normalizeNotification = (input: Partial<NotificationItem>): NotificationItem => ({
  id: input.id ?? fallbackId(),
  userId: input.userId,
  title: input.title ?? '',
  body: input.body ?? '',
  category: (input.category as NotificationItem['category']) ?? 'system',
  severity: (input.severity as NotificationItem['severity']) ?? 'info',
  type: input.type ?? 'generic',
  topic: input.topic ?? null,
  icon: input.icon ?? null,
  actionLabel: input.actionLabel ?? null,
  actionUrl: input.actionUrl ?? null,
  metadata: input.metadata ?? null,
  read: Boolean(input.read),
  readAt: input.readAt ?? null,
  createdAt: input.createdAt ?? new Date().toISOString(),
  updatedAt: input.updatedAt ?? input.createdAt ?? new Date().toISOString(),
  muted: Boolean(input.muted),
  expiresAt: input.expiresAt ?? null,
});

const sortByCreatedAtDesc = (items: NotificationItem[]) =>
  [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

const mergeNotifications = (
  current: NotificationItem[],
  incoming: NotificationItem[]
): NotificationItem[] => {
  if (!incoming.length) {
    return current;
  }

  const map = new Map(current.map(item => [item.id, item]));
  incoming.forEach(item => {
    map.set(item.id, normalizeNotification({ ...map.get(item.id), ...item }));
  });

  return sortByCreatedAtDesc(Array.from(map.values()));
};

const initialMeta: NotificationFeedMeta = {
  unreadCount: 0,
  nextCursor: null,
  hasMore: false,
};

export const loadNotifications = createEvent();
export const loadMoreNotifications = createEvent();
export const refreshNotifications = createEvent();
export const markNotificationRead = createEvent<string>();
export const markNotificationUnread = createEvent<string>();
export const markAllNotificationsRead = createEvent();
export const removeNotification = createEvent<string>();
export const deleteNotification = createEvent<string>();
export const loadNotificationPreferences = createEvent();
export const updateNotificationPreferences = createEvent<UpdateNotificationPreferencesPayload>();

export const notificationRealtimeReceived = createEvent<NotificationItem>();
export const notificationRealtimeUpdated = createEvent<
  Partial<NotificationItem> & { id?: string; deleted?: boolean; markAllRead?: boolean }
>();

const loadNotificationFeedFx = createEffect(
  async ({ cursor, append }: { cursor?: string | null; append?: boolean }) => {
    const response = await notificationsApi.getNotifications({
      before: cursor ?? undefined,
    });
    return { ...response, append: Boolean(append) };
  }
);

const markNotificationReadFx = createEffect(async (id: string) => {
  const { notification } = await notificationsApi.markRead(id);
  return normalizeNotification(notification);
});

const markNotificationUnreadFx = createEffect(async (id: string) => {
  const { notification } = await notificationsApi.markUnread(id);
  return normalizeNotification(notification);
});

const markAllReadFx = createEffect(async () => {
  return notificationsApi.markAllRead();
});

const deleteNotificationFx = createEffect(async (id: string) => {
  await notificationsApi.deleteNotification(id);
  return id;
});

const fetchPreferencesFx = createEffect(async () => {
  return notificationsApi.getPreferences();
});

const updatePreferencesFx = createEffect(async (payload: UpdateNotificationPreferencesPayload) => {
  return notificationsApi.updatePreferences(payload);
});

export const $notifications = createStore<NotificationItem[]>([])
  .on(loadNotificationFeedFx.doneData, (state, payload) =>
    payload.append
      ? mergeNotifications(state, payload.items.map(normalizeNotification))
      : sortByCreatedAtDesc(payload.items.map(normalizeNotification))
  )
  .on(markNotificationReadFx.doneData, (state, notification) =>
    mergeNotifications(state, [notification])
  )
  .on(markNotificationUnreadFx.doneData, (state, notification) =>
    mergeNotifications(state, [notification])
  )
  .on(notificationRealtimeReceived, (state, notification) =>
    mergeNotifications(state, [notification])
  )
  .on(notificationRealtimeUpdated, (state, payload) => {
    if (payload.markAllRead) {
      return state.map(item => ({ ...item, read: true, readAt: item.readAt ?? new Date().toISOString() }));
    }

    if (payload.deleted && payload.id) {
      return state.filter(item => item.id !== payload.id);
    }

    if (payload.id) {
      const existing = state.find(item => item.id === payload.id);
      return mergeNotifications(state, [normalizeNotification({ ...existing, ...payload })]);
    }

    return state;
  })
  .on(markAllReadFx.done, state =>
    state.map(item => ({ ...item, read: true, readAt: item.readAt ?? new Date().toISOString() }))
  )
  .on(deleteNotificationFx.doneData, (state, id) => state.filter(item => item.id !== id))
  .on(removeNotification, (state, id) => state.filter(item => item.id !== id));

export const $notificationMeta = createStore<NotificationFeedMeta>(initialMeta)
  .on(loadNotificationFeedFx.doneData, (_, payload) => ({
    unreadCount: payload.meta?.unreadCount ?? 0,
    nextCursor: payload.meta?.nextCursor ?? null,
    hasMore: Boolean(payload.meta?.hasMore ?? payload.meta?.nextCursor),
  }))
  .on(notificationRealtimeReceived, (state, notification) => ({
    ...state,
    unreadCount: notification.read ? state.unreadCount : state.unreadCount + 1,
  }))
  .on(markNotificationReadFx.doneData, state => ({
    ...state,
    unreadCount: Math.max(state.unreadCount - 1, 0),
  }))
  .on(markNotificationUnreadFx.doneData, state => ({
    ...state,
    unreadCount: state.unreadCount + 1,
  }))
  .on(markAllReadFx.done, state => ({
    ...state,
    unreadCount: 0,
  }))
  .on(notificationRealtimeUpdated, (state, payload) => {
    if (payload.markAllRead) {
      return { ...state, unreadCount: 0 };
    }
    if (payload.read && payload.id) {
      return { ...state, unreadCount: Math.max(state.unreadCount - 1, 0) };
    }
    if (payload.id && payload.read === false) {
      return { ...state, unreadCount: state.unreadCount + 1 };
    }
    return state;
  })
  .on(deleteNotificationFx.doneData, state => ({ ...state }));

export const $notificationPreferences = createStore<NotificationPreferences | null>(null)
  .on(fetchPreferencesFx.doneData, (_, preferences) => preferences)
  .on(updatePreferencesFx.doneData, (_, preferences) => preferences);

export const $notificationsLoading = loadNotificationFeedFx.pending;
export const $notificationPreferencesPending = combine(
  fetchPreferencesFx.pending,
  updatePreferencesFx.pending,
  (loading, updating) => loading || updating
);

export const $unreadNotificationsCount = combine(
  $notificationMeta,
  meta => meta.unreadCount
);

sample({
  clock: loadNotifications,
  source: $currentUser,
  filter: (user): user is User => Boolean(user),
  fn: () => ({ cursor: null, append: false }),
  target: loadNotificationFeedFx,
});

sample({
  clock: refreshNotifications,
  source: $currentUser,
  filter: (user): user is User => Boolean(user),
  fn: () => ({ cursor: null, append: false }),
  target: loadNotificationFeedFx,
});

sample({
  clock: loadMoreNotifications,
  source: combine({ user: $currentUser, meta: $notificationMeta }),
  filter: ({ user, meta }) => Boolean(user && (meta.nextCursor || meta.hasMore)),
  fn: ({ meta }) => ({ cursor: meta.nextCursor ?? undefined, append: true }),
  target: loadNotificationFeedFx,
});

sample({
  clock: markNotificationRead,
  source: $currentUser,
  filter: (user): user is User => Boolean(user),
  fn: (_, id) => id,
  target: markNotificationReadFx,
});

sample({
  clock: markNotificationUnread,
  source: $currentUser,
  filter: (user): user is User => Boolean(user),
  fn: (_, id) => id,
  target: markNotificationUnreadFx,
});

sample({
  clock: markAllNotificationsRead,
  source: $currentUser,
  filter: (user): user is User => Boolean(user),
  target: markAllReadFx,
});

sample({
  clock: deleteNotification,
  source: $currentUser,
  filter: (user): user is User => Boolean(user),
  fn: (_, id) => id,
  target: deleteNotificationFx,
});

sample({
  clock: loadNotificationPreferences,
  source: $currentUser,
  filter: (user): user is User => Boolean(user),
  target: fetchPreferencesFx,
});

sample({
  clock: updateNotificationPreferences,
  source: $currentUser,
  filter: (user): user is User => Boolean(user),
  fn: (_, payload) => payload,
  target: updatePreferencesFx,
});

sample({
  clock: $currentUser.updates,
  filter: (user): user is User => Boolean(user),
  target: loadNotifications,
});

if (typeof window !== 'undefined') {
  onSocketEvent('notifications:new', payload => {
    notificationRealtimeReceived(normalizeNotification(payload as Partial<NotificationItem>));
  });

  onSocketEvent('notifications:updated', payload => {
    notificationRealtimeUpdated(payload as Partial<NotificationItem> & { id?: string; deleted?: boolean; markAllRead?: boolean });
  });
}

const severityToToast = (severity: NotificationItem['severity']): 'success' | 'error' =>
  severity === 'danger' || severity === 'warning' ? 'error' : 'success';

sample({
  clock: notificationRealtimeReceived,
  fn: notification => ({
    message: notification.title,
    type: severityToToast(notification.severity),
    durationMs: 4000,
  }),
  target: showToast,
});
