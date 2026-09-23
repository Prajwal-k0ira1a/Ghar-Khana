import { api } from './client';
import type { NotificationPriority } from '@gharkhana/types';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  priority: NotificationPriority;
  readAt: string | null;
  createdAt: string;
}

export const notificationsApi = {
  list: (unreadOnly = false) =>
    api.get<AppNotification[]>(`/notifications${unreadOnly ? '?unreadOnly=true' : ''}`),
  markRead: (id: string) => api.patch<AppNotification>(`/notifications/${id}/read`),
  markAllRead: () => api.post<{ success: boolean }>('/notifications/read-all'),
  registerDeviceToken: (expoPushToken: string, platform: 'IOS' | 'ANDROID') =>
    api.post('/notifications/device-tokens', { expoPushToken, platform }),
};
