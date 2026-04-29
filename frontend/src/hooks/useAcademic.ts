// ==================== ACADEMIC HOOKS (Exams, Results, Attendance) ====================
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { academicService } from '../api/services';
import type { 
  Exam,
  Result,
  Assignment,
  AssignmentSubmission,
  Attendance,
  Timetable,
  InternalMarks,
  QueryFilters 
} from '../types';

export const academicKeys = {
  all: ['academic'] as const,
  exams: (filters?: QueryFilters) => [...academicKeys.all, 'exams', filters] as const,
  examDetail: (id: number) => [...academicKeys.all, 'exams', id] as const,
  results: (filters?: QueryFilters) => [...academicKeys.all, 'results', filters] as const,
  myResults: () => [...academicKeys.all, 'myResults'] as const,
  assignments: (filters?: QueryFilters) => [...academicKeys.all, 'assignments', filters] as const,
  assignmentDetail: (id: number) => [...academicKeys.all, 'assignments', id] as const,
  submissions: (assignmentId: number) => [...academicKeys.all, 'submissions', assignmentId] as const,
  mySubmissions: () => [...academicKeys.all, 'mySubmissions'] as const,
  attendance: (filters?: QueryFilters) => [...academicKeys.all, 'attendance', filters] as const,
  myAttendance: () => [...academicKeys.all, 'myAttendance'] as const,
  attendanceSummary: (studentId?: number) => [...academicKeys.all, 'attendanceSummary', studentId] as const,
  timetables: (filters?: QueryFilters) => [...academicKeys.all, 'timetables', filters] as const,
  myTimetable: () => [...academicKeys.all, 'myTimetable'] as const,
  facultyTimetable: (facultyId?: number) => [...academicKeys.all, 'facultyTimetable', facultyId] as const,
  internalMarks: (filters?: QueryFilters) => [...academicKeys.all, 'internalMarks', filters] as const,
  myInternalMarks: () => [...academicKeys.all, 'myInternalMarks'] as const,
};

// ============== EXAMS ==============

export const useExams = (filters?: QueryFilters) => {
  return useQuery({
    queryKey: academicKeys.exams(filters),
    queryFn: () => academicService.getExams(filters),
    select: (res) => ({ data: res.data, meta: res.meta }),
  });
};

export const useExam = (id: number) => {
  return useQuery({
    queryKey: academicKeys.examDetail(id),
    queryFn: () => academicService.getExamById(id),
    select: (res) => res.data,
    enabled: !!id,
  });
};

export const useCreateExam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: academicService.createExam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicKeys.exams() });
    },
  });
};

export const useUpdateExam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Exam> }) => 
      academicService.updateExam(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: academicKeys.examDetail(id) });
      queryClient.invalidateQueries({ queryKey: academicKeys.exams() });
    },
  });
};

export const useDeleteExam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: academicService.deleteExam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicKeys.exams() });
    },
  });
};

export const usePublishExam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: academicService.publishExam,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: academicKeys.examDetail(id) });
    },
  });
};

// ============== RESULTS ==============

export const useResults = (filters?: QueryFilters) => {
  return useQuery({
    queryKey: academicKeys.results(filters),
    queryFn: () => academicService.getResults(filters),
    select: (res) => ({ data: res.data, meta: res.meta }),
  });
};

export const useMyResults = () => {
  return useQuery({
    queryKey: academicKeys.myResults(),
    queryFn: academicService.getMyResults,
    select: (res) => res.data,
  });
};

export const useAddResult = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: academicService.addResult,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicKeys.results() });
    },
  });
};

export const useUpdateResult = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Result> }) => 
      academicService.updateResult(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicKeys.results() });
      queryClient.invalidateQueries({ queryKey: academicKeys.myResults() });
    },
  });
};

export const useBulkUploadResults = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: academicService.bulkUploadResults,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicKeys.results() });
    },
  });
};

export const usePublishResults = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: academicService.publishResults,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicKeys.results() });
    },
  });
};

// ============== ASSIGNMENTS ==============

export const useAssignments = (filters?: QueryFilters) => {
  return useQuery({
    queryKey: academicKeys.assignments(filters),
    queryFn: () => academicService.getAssignments(filters),
    select: (res) => ({ data: res.data, meta: res.meta }),
  });
};

export const useAssignment = (id: number) => {
  return useQuery({
    queryKey: academicKeys.assignmentDetail(id),
    queryFn: () => academicService.getAssignmentById(id),
    select: (res) => res.data,
    enabled: !!id,
  });
};

export const useCreateAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: academicService.createAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicKeys.assignments() });
    },
  });
};

export const useUpdateAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Assignment> }) => 
      academicService.updateAssignment(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: academicKeys.assignmentDetail(id) });
    },
  });
};

export const useDeleteAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: academicService.deleteAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicKeys.assignments() });
    },
  });
};

export const usePublishAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: academicService.publishAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicKeys.assignments() });
    },
  });
};

// ============== SUBMISSIONS ==============

export const useSubmissions = (assignmentId: number) => {
  return useQuery({
    queryKey: academicKeys.submissions(assignmentId),
    queryFn: () => academicService.getSubmissions(assignmentId),
    select: (res) => res.data,
    enabled: !!assignmentId,
  });
};

export const useMySubmissions = () => {
  return useQuery({
    queryKey: academicKeys.mySubmissions(),
    queryFn: academicService.getMySubmissions,
    select: (res) => res.data,
  });
};

export const useSubmitAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ assignmentId, data, files }: { 
      assignmentId: number; 
      data: Partial<AssignmentSubmission>; 
      files?: File[] 
    }) => academicService.submitAssignment(assignmentId, data, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicKeys.mySubmissions() });
    },
  });
};

export const useGradeSubmission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ submissionId, marks, grade, remarks }: { 
      submissionId: number; 
      marks: number; 
      grade?: string; 
      remarks?: string 
    }) => academicService.gradeSubmission(submissionId, marks, grade, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicKeys.all });
    },
  });
};

// ============== ATTENDANCE ==============

export const useAttendance = (filters?: QueryFilters) => {
  return useQuery({
    queryKey: academicKeys.attendance(filters),
    queryFn: () => academicService.getAttendance(filters),
    select: (res) => ({ data: res.data, meta: res.meta }),
  });
};

export const useMyAttendance = (subjectId?: number) => {
  return useQuery({
    queryKey: academicKeys.myAttendance(),
    queryFn: () => academicService.getMyAttendance(subjectId),
    select: (res) => res.data,
  });
};

export const useAttendanceSummary = (studentId?: number) => {
  return useQuery({
    queryKey: academicKeys.attendanceSummary(studentId),
    queryFn: () => academicService.getAttendanceSummary(studentId),
    select: (res) => res.data,
  });
};

export const useMarkAttendance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: academicService.markAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicKeys.attendance() });
    },
  });
};

export const useUpdateAttendance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, remarks }: { id: number; status: string; remarks?: string }) => 
      academicService.updateAttendance(id, status, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicKeys.attendance() });
      queryClient.invalidateQueries({ queryKey: academicKeys.attendanceSummary() });
    },
  });
};

// ============== TIMETABLES ==============

export const useTimetables = (filters?: QueryFilters) => {
  return useQuery({
    queryKey: academicKeys.timetables(filters),
    queryFn: () => academicService.getTimetables(filters),
    select: (res) => res.data,
  });
};

export const useMyTimetable = () => {
  return useQuery({
    queryKey: academicKeys.myTimetable(),
    queryFn: academicService.getMyTimetable,
    select: (res) => res.data,
  });
};

export const useFacultyTimetable = (facultyId?: number) => {
  return useQuery({
    queryKey: academicKeys.facultyTimetable(facultyId),
    queryFn: () => academicService.getFacultyTimetable(facultyId),
    select: (res) => res.data,
  });
};

export const useCreateTimetable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: academicService.createTimetable,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicKeys.timetables() });
    },
  });
};

export const useUpdateTimetable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Timetable> }) => 
      academicService.updateTimetable(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicKeys.timetables() });
    },
  });
};

export const useDeleteTimetable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: academicService.deleteTimetable,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicKeys.timetables() });
    },
  });
};

// ============== INTERNAL MARKS ==============

export const useInternalMarks = (filters?: QueryFilters) => {
  return useQuery({
    queryKey: academicKeys.internalMarks(filters),
    queryFn: () => academicService.getInternalMarks(filters),
    select: (res) => res.data,
  });
};

export const useMyInternalMarks = () => {
  return useQuery({
    queryKey: academicKeys.myInternalMarks(),
    queryFn: academicService.getMyInternalMarks,
    select: (res) => res.data,
  });
};

export const useAddInternalMarks = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: academicService.addInternalMarks,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicKeys.internalMarks() });
    },
  });
};

export const useUpdateInternalMarks = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InternalMarks> }) => 
      academicService.updateInternalMarks(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicKeys.internalMarks() });
    },
  });
};

export const usePublishInternalMarks = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: academicService.publishInternalMarks,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: academicKeys.internalMarks() });
    },
  });
};
