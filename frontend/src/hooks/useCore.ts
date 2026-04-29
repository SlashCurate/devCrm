// ==================== CORE DATA HOOKS ====================
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  collegeService, 
  departmentService, 
  programService,
  subjectService,
  academicYearService,
  semesterService,
  noticeService,
  eventService,
  universityService
} from '../api/services';
import type { 
  College, 
  Department, 
  Program, 
  Subject,
  AcademicYear,
  Semester,
  Notice,
  Event,
  QueryFilters 
} from '../types';

// ============== QUERY KEYS ==============
export const coreKeys = {
  all: ['core'] as const,
  universities: () => [...coreKeys.all, 'universities'] as const,
  universityDetail: (id: number) => [...coreKeys.all, 'universities', id] as const,
  colleges: (filters?: QueryFilters) => [...coreKeys.all, 'colleges', filters] as const,
  collegeDetail: (id: number) => [...coreKeys.all, 'colleges', id] as const,
  departments: (collegeId?: number) => [...coreKeys.all, 'departments', collegeId] as const,
  departmentDetail: (id: number) => [...coreKeys.all, 'departments', id] as const,
  programs: (filters?: QueryFilters) => [...coreKeys.all, 'programs', filters] as const,
  programDetail: (id: number) => [...coreKeys.all, 'programs', id] as const,
  subjects: (filters?: QueryFilters) => [...coreKeys.all, 'subjects', filters] as const,
  subjectDetail: (id: number) => [...coreKeys.all, 'subjects', id] as const,
  academicYears: () => [...coreKeys.all, 'academicYears'] as const,
  currentYear: () => [...coreKeys.all, 'academicYears', 'current'] as const,
  semesters: (yearId?: number) => [...coreKeys.all, 'semesters', yearId] as const,
  notices: (filters?: QueryFilters) => [...coreKeys.all, 'notices', filters] as const,
  events: (filters?: QueryFilters) => [...coreKeys.all, 'events', filters] as const,
};

// ============== UNIVERSITY HOOKS ==============

export const useUniversities = () => {
  return useQuery({
    queryKey: coreKeys.universities(),
    queryFn: universityService.getAll,
    select: (res) => res.data,
  });
};

export const useUniversity = (id: number) => {
  return useQuery({
    queryKey: coreKeys.universityDetail(id),
    queryFn: () => universityService.getById(id),
    select: (res) => res.data,
    enabled: !!id,
  });
};

// ============== COLLEGE HOOKS ==============

export const useColleges = (filters?: QueryFilters) => {
  return useQuery({
    queryKey: coreKeys.colleges(filters),
    queryFn: () => collegeService.getAll(filters),
    select: (res) => ({
      data: res.data,
      meta: res.meta,
    }),
  });
};

export const useCollege = (id: number) => {
  return useQuery({
    queryKey: coreKeys.collegeDetail(id),
    queryFn: () => collegeService.getById(id),
    select: (res) => res.data,
    enabled: !!id,
  });
};

export const useCollegeDashboard = () => {
  return useQuery({
    queryKey: [...coreKeys.all, 'collegeDashboard'],
    queryFn: collegeService.getDashboard,
    select: (res) => res.data,
  });
};

export const useCreateCollege = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: collegeService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coreKeys.all });
    },
  });
};

export const useUpdateCollege = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<College> }) => 
      collegeService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: coreKeys.collegeDetail(id) });
      queryClient.invalidateQueries({ queryKey: coreKeys.colleges() });
    },
  });
};

export const useDeleteCollege = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: collegeService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coreKeys.all });
    },
  });
};

// ============== DEPARTMENT HOOKS ==============

export const useDepartments = (collegeId?: number) => {
  return useQuery({
    queryKey: coreKeys.departments(collegeId),
    queryFn: () => departmentService.getAll(collegeId),
    select: (res) => res.data,
  });
};

export const useDepartment = (id: number) => {
  return useQuery({
    queryKey: coreKeys.departmentDetail(id),
    queryFn: () => departmentService.getById(id),
    select: (res) => res.data,
    enabled: !!id,
  });
};

export const useCreateDepartment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: departmentService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coreKeys.all });
    },
  });
};

export const useAssignHOD = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, facultyId }: { id: number; facultyId: number }) => 
      departmentService.assignHOD(id, facultyId),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: coreKeys.departmentDetail(id) });
    },
  });
};

// ============== PROGRAM HOOKS ==============

export const usePrograms = (filters?: QueryFilters) => {
  return useQuery({
    queryKey: coreKeys.programs(filters),
    queryFn: () => programService.getAll(filters),
    select: (res) => ({
      data: res.data,
      meta: res.meta,
    }),
  });
};

export const useProgram = (id: number) => {
  return useQuery({
    queryKey: coreKeys.programDetail(id),
    queryFn: () => programService.getById(id),
    select: (res) => res.data,
    enabled: !!id,
  });
};

export const useProgramSubjects = (id: number) => {
  return useQuery({
    queryKey: [...coreKeys.programDetail(id), 'subjects'],
    queryFn: () => programService.getSubjects(id),
    select: (res) => res.data,
    enabled: !!id,
  });
};

export const useCreateProgram = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: programService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coreKeys.all });
    },
  });
};

export const useUpdateProgram = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Program> }) => 
      programService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: coreKeys.programDetail(id) });
      queryClient.invalidateQueries({ queryKey: coreKeys.programs() });
    },
  });
};

// Backward compatible alias
export const useCourses = usePrograms;

// ============== SUBJECT HOOKS ==============

export const useSubjects = (filters?: QueryFilters) => {
  return useQuery({
    queryKey: coreKeys.subjects(filters),
    queryFn: () => subjectService.getAll(filters),
    select: (res) => ({
      data: res.data,
      meta: res.meta,
    }),
  });
};

export const useSubject = (id: number) => {
  return useQuery({
    queryKey: coreKeys.subjectDetail(id),
    queryFn: () => subjectService.getById(id),
    select: (res) => res.data,
    enabled: !!id,
  });
};

// ============== ACADEMIC YEAR HOOKS ==============

export const useAcademicYears = () => {
  return useQuery({
    queryKey: coreKeys.academicYears(),
    queryFn: academicYearService.getAll,
    select: (res) => res.data,
  });
};

export const useCurrentAcademicYear = () => {
  return useQuery({
    queryKey: coreKeys.currentYear(),
    queryFn: academicYearService.getCurrent,
    select: (res) => res.data,
  });
};

export const useCreateAcademicYear = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: academicYearService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coreKeys.academicYears() });
    },
  });
};

export const useSetCurrentYear = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: academicYearService.setCurrent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coreKeys.academicYears() });
      queryClient.invalidateQueries({ queryKey: coreKeys.currentYear() });
    },
  });
};

// ============== SEMESTER HOOKS ==============

export const useSemesters = (yearId?: number) => {
  return useQuery({
    queryKey: coreKeys.semesters(yearId),
    queryFn: () => semesterService.getAll(yearId),
    select: (res) => res.data,
  });
};

// ============== NOTICE & EVENT HOOKS ==============

export const useNotices = (filters?: QueryFilters) => {
  return useQuery({
    queryKey: coreKeys.notices(filters),
    queryFn: () => noticeService.getAll(filters),
    select: (res) => ({
      data: res.data,
      meta: res.meta,
    }),
  });
};

export const useEvents = (filters?: QueryFilters) => {
  return useQuery({
    queryKey: coreKeys.events(filters),
    queryFn: () => eventService.getAll(filters),
    select: (res) => ({
      data: res.data,
      meta: res.meta,
    }),
  });
};

export const useCreateNotice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: noticeService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coreKeys.notices() });
    },
  });
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: eventService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coreKeys.events() });
    },
  });
};
