// ==================== AUTH SERVICE ====================
import api from '../axios';
import type { 
  LoginCredentials, 
  RegisterData, 
  AuthResponse, 
  User, 
  ApiResponse,
  PaginatedResponse,
  QueryFilters,
  PasswordResetRequest,
  PasswordResetConfirm,
  ChangePasswordData,
  Session,
  AuditLogEntry,
  RolePermissions
} from '../../types';

const AUTH_BASE = '/auth';
const USERS_BASE = '/users';

// Authentication
export const authService = {
  // Login/Logout
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>(`${AUTH_BASE}/login`, credentials);
    if (response.data.data?.token) {
      localStorage.setItem('token', response.data.data.token);
    }
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post(`${AUTH_BASE}/logout`);
    localStorage.clear();
  },

  // Registration
  register: async (data: RegisterData): Promise<ApiResponse<User>> => {
    const response = await api.post<ApiResponse<User>>(`${AUTH_BASE}/register`, data);
    return response.data;
  },

  // Current User
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    const response = await api.get<ApiResponse<User>>(`${AUTH_BASE}/me`);
    return response.data;
  },

  refreshToken: async (): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>(`${AUTH_BASE}/refresh`);
    if (response.data.data?.token) {
      localStorage.setItem('token', response.data.data.token);
    }
    return response.data;
  },

  // Password Management
  forgotPassword: async (data: PasswordResetRequest): Promise<ApiResponse<void>> => {
    const response = await api.post<ApiResponse<void>>(`${AUTH_BASE}/forgot-password`, data);
    return response.data;
  },

  resetPassword: async (data: PasswordResetConfirm): Promise<ApiResponse<void>> => {
    const response = await api.post<ApiResponse<void>>(`${AUTH_BASE}/reset-password`, data);
    return response.data;
  },

  changePassword: async (data: ChangePasswordData): Promise<ApiResponse<void>> => {
    const response = await api.post<ApiResponse<void>>(`${AUTH_BASE}/change-password`, data);
    return response.data;
  },
};

// User Management
export const userService = {
  // CRUD Operations
  getAll: async (filters?: QueryFilters): Promise<PaginatedResponse<User>> => {
    const response = await api.get<PaginatedResponse<User>>(USERS_BASE, { params: filters });
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<User>> => {
    const response = await api.get<ApiResponse<User>>(`${USERS_BASE}/${id}`);
    return response.data;
  },

  create: async (data: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await api.post<ApiResponse<User>>(USERS_BASE, data);
    return response.data;
  },

  update: async (id: number, data: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await api.put<ApiResponse<User>>(`${USERS_BASE}/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`${USERS_BASE}/${id}`);
    return response.data;
  },

  // Status Management
  toggleActive: async (id: number): Promise<ApiResponse<User>> => {
    const response = await api.patch<ApiResponse<User>>(`${USERS_BASE}/${id}/toggle-active`);
    return response.data;
  },

  // Role Management
  updateRole: async (id: number, role: string): Promise<ApiResponse<User>> => {
    const response = await api.patch<ApiResponse<User>>(`${USERS_BASE}/${id}/role`, { role });
    return response.data;
  },

  // Profile
  updateProfile: async (data: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await api.put<ApiResponse<User>>(`${USERS_BASE}/profile`, data);
    return response.data;
  },

  uploadAvatar: async (file: File): Promise<ApiResponse<{ avatar_url: string }>> => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post<ApiResponse<{ avatar_url: string }>>(
      `${USERS_BASE}/avatar`, 
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  // Sessions
  getSessions: async (): Promise<ApiResponse<Session[]>> => {
    const response = await api.get<ApiResponse<Session[]>>(`${USERS_BASE}/sessions`);
    return response.data;
  },

  revokeSession: async (sessionId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`${USERS_BASE}/sessions/${sessionId}`);
    return response.data;
  },

  revokeAllSessions: async (): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`${USERS_BASE}/sessions`);
    return response.data;
  },

  // Permissions & Roles
  getPermissions: async (): Promise<ApiResponse<RolePermissions>> => {
    const response = await api.get<ApiResponse<RolePermissions>>(`${USERS_BASE}/permissions`);
    return response.data;
  },

  // Audit Logs
  getAuditLogs: async (filters?: QueryFilters): Promise<PaginatedResponse<AuditLogEntry>> => {
    const response = await api.get<PaginatedResponse<AuditLogEntry>>(`${USERS_BASE}/audit-logs`, { 
      params: filters 
    });
    return response.data;
  },
};

// Default export as object
export default { auth: authService, users: userService };
