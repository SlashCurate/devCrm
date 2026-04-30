// ==================== AUTH TYPES (auth schema) ====================

export type UserRole = 
  | 'super_admin' 
  | 'university_admin' 
  | 'finance_controller' 
  | 'registrar' 
  | 'college_admin' 
  | 'hod' 
  | 'faculty' 
  | 'student' 
  | 'librarian' 
  | 'hostel_warden';

export interface User {
  id: string; // UUID
  username: string;
  email: string;
  password?: string; // Only for creation
  role_id: number;
  is_active: boolean;
  is_verified: boolean;
  last_login?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  phone?: string;
  role?: UserRole;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

export interface JWTPayload {
  user_id: string; // UUID
  username: string;
  email: string;
  role: string;
  college_id?: number;
  exp: number;
}

export interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
}

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
}

// Password & Security
export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  new_password: string;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
}

// User Profile Extensions
export interface UserProfile {
  user_id: string; // UUID
  avatar_url?: string;
  preferences: UserPreferences;
  two_factor_enabled: boolean;
  backup_codes?: string[];
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: NotificationPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  categories: string[];
}

export interface Session {
  id: string;
  user_id: string; // UUID
  ip_address: string;
  user_agent: string;
  created_at: string;
  expires_at: string;
  is_current: boolean;
}

export interface AuditLogEntry {
  id: number;
  user_id: string; // UUID
  user?: User;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'VIEW';
  target_table: string;
  record_id: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address: string;
  user_agent: string;
  created_at: string;
  details?: Record<string, unknown>;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  current_page: number;
  total_pages: number;
  total_items: number;
  items_per_page: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta;
}

// Search & Filter Types
export interface QueryFilters {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  search?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface DateRangeFilter {
  start_date?: string;
  end_date?: string;
}

// Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
  status: number;
}

// Loading States
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  state: LoadingState;
}
