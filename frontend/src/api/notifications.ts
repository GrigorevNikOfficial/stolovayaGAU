import { httpClient } from './http-client';
import type {
  NotificationFeedResponse,
  NotificationItem,
  NotificationPreferences,
  NotificationSummary,
  UpdateNotificationPreferencesPayload,
} from '../types/notification';

export type NotificationQuery = {
  before?: string | null;
  limit?: number;
  category?: string;
  status?: 'all' | 'unread';
};

export const notificationsApi = {
  async getNotifications(params?: NotificationQuery): Promise<NotificationFeedResponse> {
    return httpClient.get<NotificationFeedResponse>('/notifications', {
      params: {
        ...params,
        before: params?.before ?? undefined,
      },
    });
  },

  async markRead(id: string) {
    return httpClient.patch<{ notification: NotificationItem }>(`/notifications/${id}/read`);
  },

  async markUnread(id: string) {
    return httpClient.patch<{ notification: NotificationItem }>(`/notifications/${id}/unread`);
  },

  async markAllRead() {
    return httpClient.post<{ updated: number }>('/notifications/read-all');
  },

  async deleteNotification(id: string) {
    return httpClient.delete<{ success: boolean }>(`/notifications/${id}`);
  },

  async getSummary(): Promise<NotificationSummary> {
    return httpClient.get<NotificationSummary>('/notifications/summary');
  },

  async getPreferences(): Promise<NotificationPreferences> {
    return httpClient.get<NotificationPreferences>('/notifications/preferences');
  },

  async updatePreferences(payload: UpdateNotificationPreferencesPayload): Promise<NotificationPreferences> {
    return httpClient.put<NotificationPreferences>('/notifications/preferences', payload);
  },
};
