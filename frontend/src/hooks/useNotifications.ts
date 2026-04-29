// ==================== NOTIFICATION HOOKS ====================
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService, announcementService } from '../api/services';
import type { 
  Notification,
  NotificationPreference,
  Announcement,
  QueryFilters 
} from '../types';

// ============== NOTIFICATION KEYS ==============
export const notificationKeys = {
  all: ['notifications'] as const,
  myNotifications: () => [...notificationKeys.all, 'my'] as const,
  unreadCount: () => [...notificationKeys.all, 'unreadCount'] as const,
  preferences: () => [...notificationKeys.all, 'preferences'] as const,
};

export const announcementKeys = {
  all: ['announcements'] as const,
  lists: (filters?: QueryFilters) => [...announcementKeys.all, 'list', filters] as const,
  detail: (id: number) => [...announcementKeys.all, 'detail', id] as const,
};

// ============== NOTIFICATIONS ==============

export const useMyNotifications = () => {
  return useQuery({
    queryKey: notificationKeys.myNotifications(),
    queryFn: notificationService.getMyNotifications,
    select: (res) => res.data,
  });
};

export const useUnreadCount = () => {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: notificationService.getUnreadCount,
    select: (res) => res.data?.count ?? 0,
    refetchInterval: 60000, // Refetch every minute
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.myNotifications() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.myNotifications() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationService.deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.myNotifications() });
    },
  });
};

export const useDeleteAllNotifications = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationService.deleteAll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.myNotifications() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
};

// ============== NOTIFICATION PREFERENCES ==============

export const useNotificationPreferences = () => {
  return useQuery({
    queryKey: notificationKeys.preferences(),
    queryFn: notificationService.getPreferences,
    select: (res) => res.data,
  });
};

export const useUpdateNotificationPreference = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ category, data }: { category: string; data: Partial<NotificationPreference> }) => 
      notificationService.updatePreference(category, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.preferences() });
    },
  });
};

// ============== ANNOUNCEMENTS ==============

export const useAnnouncements = (filters?: QueryFilters) => {
  return useQuery({
    queryKey: announcementKeys.lists(filters),
    queryFn: () => announcementService.getAll(filters),
    select: (res) => ({ data: res.data, meta: res.meta }),
  });
};

export const useAnnouncement = (id: number) => {
  return useQuery({
    queryKey: announcementKeys.detail(id),
    queryFn: () => announcementService.getById(id),
    select: (res) => res.data,
    enabled: !!id,
  });
};

export const useCreateAnnouncement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: announcementService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.lists() });
    },
  });
};

export const useUpdateAnnouncement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Announcement> }) => 
      announcementService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: announcementKeys.lists() });
    },
  });
};

export const useDeleteAnnouncement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: announcementService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.lists() });
    },
  });
};

export const usePublishAnnouncement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: announcementService.publish,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: announcementKeys.lists() });
    },
  });
};

export const useUnpublishAnnouncement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: announcementService.unpublish,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: announcementKeys.lists() });
    },
  });
};
