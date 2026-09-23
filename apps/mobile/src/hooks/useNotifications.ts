import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../api/notifications';

/** In-app notification center (NOTIFICATIONS.md §6 — durable record, push is best-effort). */
export const useNotifications = (unreadOnly = false) =>
  useQuery({
    queryKey: ['notifications', unreadOnly],
    queryFn: () => notificationsApi.list(unreadOnly),
    staleTime: 60_000,
  });

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
