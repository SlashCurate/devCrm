// ==================== AUTH HOOKS ====================
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService, userService } from '../api/services';
import type { 
  LoginCredentials, 
  RegisterData, 
  User, 
  ChangePasswordData,
  QueryFilters,
  Session
} from '../types';

// Keys for cache invalidation
export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
  sessions: () => [...authKeys.all, 'sessions'] as const,
  users: (filters?: QueryFilters) => [...authKeys.all, 'users', filters] as const,
  userDetail: (id: number) => [...authKeys.all, 'users', id] as const,
};

// Login hook
export const useLogin = () => {
  return useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      // Token is already stored in localStorage by the service
      console.log('Login successful');
    },
  });
};

// Logout hook
export const useLogout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      // Clear all queries from cache
      queryClient.clear();
      window.location.href = '/login';
    },
  });
};

// Register hook
export const useRegister = () => {
  return useMutation({
    mutationFn: authService.register,
  });
};

// Get current user hook
export const useCurrentUser = () => {
  return useQuery({
    queryKey: authKeys.user(),
    queryFn: authService.getCurrentUser,
    select: (res) => res.data,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Change password hook
export const useChangePassword = () => {
  return useMutation({
    mutationFn: authService.changePassword,
  });
};

// Forgot password hook
export const useForgotPassword = () => {
  return useMutation({
    mutationFn: authService.forgotPassword,
  });
};

// Reset password hook
export const useResetPassword = () => {
  return useMutation({
    mutationFn: authService.resetPassword,
  });
};

// ============== USER MANAGEMENT HOOKS ==============

// Get all users
export const useUsers = (filters?: QueryFilters) => {
  return useQuery({
    queryKey: authKeys.users(filters),
    queryFn: () => userService.getAll(filters),
    select: (res) => ({
      data: res.data,
      meta: res.meta,
    }),
  });
};

// Get user by ID
export const useUser = (id: number) => {
  return useQuery({
    queryKey: authKeys.userDetail(id),
    queryFn: () => userService.getById(id),
    select: (res) => res.data,
    enabled: !!id,
  });
};

// Create user
export const useCreateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: userService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
  });
};

// Update user
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<User> }) => 
      userService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: authKeys.userDetail(id) });
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
  });
};

// Delete user
export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: userService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
  });
};

// Toggle user active status
export const useToggleUserActive = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: userService.toggleActive,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: authKeys.userDetail(id) });
    },
  });
};

// Update user role
export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) => 
      userService.updateRole(id, role),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: authKeys.userDetail(id) });
    },
  });
};

// Update profile
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: userService.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.user() });
    },
  });
};

// Upload avatar
export const useUploadAvatar = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: userService.uploadAvatar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.user() });
    },
  });
};

// Get sessions
export const useSessions = () => {
  return useQuery({
    queryKey: authKeys.sessions(),
    queryFn: userService.getSessions,
    select: (res) => res.data,
  });
};

// Revoke session
export const useRevokeSession = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: userService.revokeSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.sessions() });
    },
  });
};

// Revoke all sessions
export const useRevokeAllSessions = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: userService.revokeAllSessions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.sessions() });
      // Redirect to login after revoking all sessions
      window.location.href = '/login';
    },
  });
};
