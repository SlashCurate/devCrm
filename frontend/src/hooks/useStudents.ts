// ==================== STUDENT HOOKS ====================
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentService } from '../api/services';
import type { 
  Student, 
  AdmissionApplication,
  StudentDocument,
  StudentLeave,
  CertificateRequest,
  Grievance,
  QueryFilters 
} from '../types';

export const studentKeys = {
  all: ['students'] as const,
  lists: (filters?: QueryFilters) => [...studentKeys.all, 'list', filters] as const,
  detail: (id: number) => [...studentKeys.all, 'detail', id] as const,
  profile: () => [...studentKeys.all, 'profile'] as const,
  dashboard: () => [...studentKeys.all, 'dashboard'] as const,
  applications: (filters?: QueryFilters) => [...studentKeys.all, 'applications', filters] as const,
  myApplications: () => [...studentKeys.all, 'myApplications'] as const,
  documents: (studentId?: number) => [...studentKeys.all, 'documents', studentId] as const,
  leaves: (studentId?: number) => [...studentKeys.all, 'leaves', studentId] as const,
  certificates: () => [...studentKeys.all, 'certificates'] as const,
  grievances: () => [...studentKeys.all, 'grievances'] as const,
};

// ============== STUDENT CRUD ==============

export const useStudents = (filters?: QueryFilters) => {
  return useQuery({
    queryKey: studentKeys.lists(filters),
    queryFn: () => studentService.getAll(filters),
    select: (res) => ({ data: res.data, meta: res.meta }),
  });
};

export const useStudent = (id: number) => {
  return useQuery({
    queryKey: studentKeys.detail(id),
    queryFn: () => studentService.getById(id),
    select: (res) => res.data,
    enabled: !!id,
  });
};

export const useMyStudentProfile = () => {
  return useQuery({
    queryKey: studentKeys.profile(),
    queryFn: studentService.getMyProfile,
    select: (res) => res.data,
  });
};

export const useStudentDashboard = () => {
  return useQuery({
    queryKey: studentKeys.dashboard(),
    queryFn: studentService.getDashboard,
    select: (res) => res.data,
  });
};

export const useCreateStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: studentService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.all });
    },
  });
};

export const useUpdateStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Student> }) => 
      studentService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: studentKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
    },
  });
};

export const useUpdateMyProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: studentService.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.profile() });
    },
  });
};

export const useDeleteStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: studentService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.all });
    },
  });
};

// ============== APPLICATIONS ==============

export const useApplications = (filters?: QueryFilters) => {
  return useQuery({
    queryKey: studentKeys.applications(filters),
    queryFn: () => studentService.getApplications(filters),
    select: (res) => ({ data: res.data, meta: res.meta }),
  });
};

export const useMyApplications = () => {
  return useQuery({
    queryKey: studentKeys.myApplications(),
    queryFn: studentService.getMyApplications,
    select: (res) => res.data,
  });
};

export const useApplication = (id: number) => {
  return useQuery({
    queryKey: [...studentKeys.all, 'application', id],
    queryFn: () => studentService.getApplicationById(id),
    select: (res) => res.data,
    enabled: !!id,
  });
};

export const useSubmitApplication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: studentService.submitApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.myApplications() });
      queryClient.invalidateQueries({ queryKey: studentKeys.applications() });
    },
  });
};

export const useUpdateApplication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AdmissionApplication> }) => 
      studentService.updateApplication(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.myApplications() });
    },
  });
};

export const useUpdateApplicationStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, remarks }: { id: number; status: string; remarks?: string }) => 
      studentService.updateApplicationStatus(id, status, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.applications() });
    },
  });
};

// ============== DOCUMENTS ==============

export const useDocuments = (studentId?: number) => {
  return useQuery({
    queryKey: studentKeys.documents(studentId),
    queryFn: () => studentService.getDocuments(studentId),
    select: (res) => res.data,
  });
};

export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, documentType, studentId }: { file: File; documentType: string; studentId?: number }) => 
      studentService.uploadDocument(file, documentType, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.documents() });
    },
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: studentService.deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.documents() });
    },
  });
};

// ============== LEAVES ==============

export const useStudentLeaves = (studentId?: number) => {
  return useQuery({
    queryKey: studentKeys.leaves(studentId),
    queryFn: () => studentService.getLeaves(studentId),
    select: (res) => res.data,
  });
};

export const useApplyLeave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: studentService.applyLeave,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.leaves() });
    },
  });
};

export const useUpdateLeaveStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leaveId, status, remarks }: { leaveId: number; status: string; remarks?: string }) => 
      studentService.updateLeaveStatus(leaveId, status, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.leaves() });
    },
  });
};

// ============== CERTIFICATES ==============

export const useCertificates = () => {
  return useQuery({
    queryKey: studentKeys.certificates(),
    queryFn: studentService.getCertificates,
    select: (res) => res.data,
  });
};

export const useRequestCertificate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: studentService.requestCertificate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.certificates() });
    },
  });
};

// ============== GRIEVANCES ==============

export const useGrievances = () => {
  return useQuery({
    queryKey: studentKeys.grievances(),
    queryFn: studentService.getGrievances,
    select: (res) => res.data,
  });
};

export const useSubmitGrievance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: studentService.submitGrievance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.grievances() });
    },
  });
};

export const useUpdateGrievance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Grievance> }) => 
      studentService.updateGrievance(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.grievances() });
    },
  });
};
