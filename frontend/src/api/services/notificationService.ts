// ==================== NOTIFICATION SERVICE ====================
import api from '../axios';
import type { 
  Notification,
  NotificationPreference,
  Announcement,
  ApiResponse,
  PaginatedResponse,
  QueryFilters 
} from '../../types';

export const notificationService = {
  // Notifications
  getMyNotifications: async (): Promise<ApiResponse<Notification[]>> => {
    const response = await api.get<ApiResponse<Notification[]>>('/notifications');
    return response.data;
  },

  getUnreadCount: async (): Promise<ApiResponse<{ count: number }>> => {
    const response = await api.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (id: number): Promise<ApiResponse<Notification>> => {
    const response = await api.patch<ApiResponse<Notification>>(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<ApiResponse<void>> => {
    const response = await api.post<ApiResponse<void>>('/notifications/mark-all-read');
    return response.data;
  },

  deleteNotification: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/notifications/${id}`);
    return response.data;
  },

  deleteAll: async (): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>('/notifications');
    return response.data;
  },

  // Preferences
  getPreferences: async (): Promise<ApiResponse<NotificationPreference[]>> => {
    const response = await api.get<ApiResponse<NotificationPreference[]>>('/notifications/preferences');
    return response.data;
  },

  updatePreference: async (category: string, data: Partial<NotificationPreference>): Promise<ApiResponse<NotificationPreference>> => {
    const response = await api.put<ApiResponse<NotificationPreference>>(`/notifications/preferences/${category}`, data);
    return response.data;
  },
};

// Announcements
export const announcementService = {
  getAll: async (filters?: QueryFilters): Promise<PaginatedResponse<Announcement>> => {
    const response = await api.get<PaginatedResponse<Announcement>>('/announcements', { params: filters });
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<Announcement>> => {
    const response = await api.get<ApiResponse<Announcement>>(`/announcements/${id}`);
    return response.data;
  },

  create: async (data: Partial<Announcement>): Promise<ApiResponse<Announcement>> => {
    const response = await api.post<ApiResponse<Announcement>>('/announcements', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Announcement>): Promise<ApiResponse<Announcement>> => {
    const response = await api.put<ApiResponse<Announcement>>(`/announcements/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/announcements/${id}`);
    return response.data;
  },

  publish: async (id: number): Promise<ApiResponse<Announcement>> => {
    const response = await api.patch<ApiResponse<Announcement>>(`/announcements/${id}/publish`);
    return response.data;
  },

  unpublish: async (id: number): Promise<ApiResponse<Announcement>> => {
    const response = await api.patch<ApiResponse<Announcement>>(`/announcements/${id}/unpublish`);
    return response.data;
  },
};

export default { notifications: notificationService, announcements: announcementService };
