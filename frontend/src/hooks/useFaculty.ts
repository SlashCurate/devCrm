// ==================== FACULTY HOOKS ====================
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { facultyService } from '../api/services';
import type { 
  Faculty,
  FacultyLeave,
  ResearchPublication,
  TeachingWorkload,
  QueryFilters 
} from '../types';

export const facultyKeys = {
  all: ['faculty'] as const,
  lists: (filters?: QueryFilters) => [...facultyKeys.all, 'list', filters] as const,
  detail: (id: number) => [...facultyKeys.all, 'detail', id] as const,
  profile: () => [...facultyKeys.all, 'profile'] as const,
  dashboard: () => [...facultyKeys.all, 'dashboard'] as const,
  leaves: (facultyId?: number) => [...facultyKeys.all, 'leaves', facultyId] as const,
  attendance: (month?: string, year?: number) => [...facultyKeys.all, 'attendance', month, year] as const,
  publications: (facultyId?: number) => [...facultyKeys.all, 'publications', facultyId] as const,
  workload: (semesterId?: number) => [...facultyKeys.all, 'workload', semesterId] as const,
};

// ============== FACULTY CRUD ==============

export const useFaculty = (filters?: QueryFilters) => {
  return useQuery({
    queryKey: facultyKeys.lists(filters),
    queryFn: () => facultyService.getAll(filters),
    select: (res) => ({ data: res.data, meta: res.meta }),
  });
};

export const useFacultyMember = (id: number) => {
  return useQuery({
    queryKey: facultyKeys.detail(id),
    queryFn: () => facultyService.getById(id),
    select: (res) => res.data,
    enabled: !!id,
  });
};

export const useMyFacultyProfile = () => {
  return useQuery({
    queryKey: facultyKeys.profile(),
    queryFn: facultyService.getMyProfile,
    select: (res) => res.data,
  });
};

export const useFacultyDashboard = () => {
  return useQuery({
    queryKey: facultyKeys.dashboard(),
    queryFn: facultyService.getDashboard,
    select: (res) => res.data,
  });
};

export const useCreateFaculty = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: facultyService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: facultyKeys.all });
    },
  });
};

export const useUpdateFaculty = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Faculty> }) => 
      facultyService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: facultyKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: facultyKeys.lists() });
    },
  });
};

export const useUpdateFacultyProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: facultyService.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: facultyKeys.profile() });
    },
  });
};

export const useDeleteFaculty = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: facultyService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: facultyKeys.all });
    },
  });
};

// ============== LEAVES ==============

export const useFacultyLeaves = (facultyId?: number) => {
  return useQuery({
    queryKey: facultyKeys.leaves(facultyId),
    queryFn: () => facultyService.getLeaves(facultyId),
    select: (res) => res.data,
  });
};

export const useApplyFacultyLeave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: facultyService.applyLeave,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: facultyKeys.leaves() });
    },
  });
};

export const useUpdateFacultyLeaveStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leaveId, status, remarks }: { leaveId: number; status: string; remarks?: string }) => 
      facultyService.updateLeaveStatus(leaveId, status, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: facultyKeys.leaves() });
    },
  });
};

// ============== ATTENDANCE ==============

export const useFacultyAttendance = (month?: string, year?: number) => {
  return useQuery({
    queryKey: facultyKeys.attendance(month, year),
    queryFn: () => facultyService.getAttendance(month, year),
    select: (res) => res.data,
  });
};

export const useMarkFacultyAttendance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ status, inTime, outTime }: { status: string; inTime?: string; outTime?: string }) => 
      facultyService.markAttendance(status, inTime, outTime),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: facultyKeys.attendance() });
    },
  });
};

// ============== PUBLICATIONS ==============

export const usePublications = (facultyId?: number) => {
  return useQuery({
    queryKey: facultyKeys.publications(facultyId),
    queryFn: () => facultyService.getPublications(facultyId),
    select: (res) => res.data,
  });
};

export const useAddPublication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: facultyService.addPublication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: facultyKeys.publications() });
    },
  });
};

export const useUpdatePublication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ResearchPublication> }) => 
      facultyService.updatePublication(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: facultyKeys.publications() });
    },
  });
};

export const useDeletePublication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: facultyService.deletePublication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: facultyKeys.publications() });
    },
  });
};

// ============== WORKLOAD ==============

export const useWorkload = (semesterId?: number) => {
  return useQuery({
    queryKey: facultyKeys.workload(semesterId),
    queryFn: () => facultyService.getWorkload(semesterId),
    select: (res) => res.data,
  });
};

export const useAssignWorkload = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ facultyId, data }: { facultyId: number; data: Partial<TeachingWorkload> }) => 
      facultyService.assignWorkload(facultyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: facultyKeys.workload() });
    },
  });
};
