// ==================== ACADEMIC SERVICE ====================
import api from '../axios';
import type { 
  Exam,
  Result,
  Assignment,
  AssignmentSubmission,
  Attendance,
  AttendanceSummary,
  Timetable,
  InternalMarks,
  ApiResponse,
  PaginatedResponse,
  QueryFilters 
} from '../../types';

export const academicService = {
  // Exams
  getExams: async (filters?: QueryFilters): Promise<PaginatedResponse<Exam>> => {
    const response = await api.get<PaginatedResponse<Exam>>('/exams', { params: filters });
    return response.data;
  },

  getExamById: async (id: number): Promise<ApiResponse<Exam>> => {
    const response = await api.get<ApiResponse<Exam>>(`/exams/${id}`);
    return response.data;
  },

  createExam: async (data: Partial<Exam>): Promise<ApiResponse<Exam>> => {
    const response = await api.post<ApiResponse<Exam>>('/exams', data);
    return response.data;
  },

  updateExam: async (id: number, data: Partial<Exam>): Promise<ApiResponse<Exam>> => {
    const response = await api.put<ApiResponse<Exam>>(`/exams/${id}`, data);
    return response.data;
  },

  deleteExam: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/exams/${id}`);
    return response.data;
  },

  publishExam: async (id: number): Promise<ApiResponse<Exam>> => {
    const response = await api.post<ApiResponse<Exam>>(`/exams/${id}/publish`);
    return response.data;
  },

  // Results
  getResults: async (filters?: QueryFilters): Promise<PaginatedResponse<Result>> => {
    const response = await api.get<PaginatedResponse<Result>>('/results', { params: filters });
    return response.data;
  },

  getMyResults: async (): Promise<ApiResponse<Result[]>> => {
    const response = await api.get<ApiResponse<Result[]>>('/results/my');
    return response.data;
  },

  getResultById: async (id: number): Promise<ApiResponse<Result>> => {
    const response = await api.get<ApiResponse<Result>>(`/results/${id}`);
    return response.data;
  },

  addResult: async (data: Partial<Result>): Promise<ApiResponse<Result>> => {
    const response = await api.post<ApiResponse<Result>>('/results', data);
    return response.data;
  },

  updateResult: async (id: number, data: Partial<Result>): Promise<ApiResponse<Result>> => {
    const response = await api.put<ApiResponse<Result>>(`/results/${id}`, data);
    return response.data;
  },

  bulkUploadResults: async (results: Partial<Result>[]): Promise<ApiResponse<Result[]>> => {
    const response = await api.post<ApiResponse<Result[]>>('/results/bulk', { results });
    return response.data;
  },

  publishResults: async (examId?: number): Promise<ApiResponse<void>> => {
    const url = examId ? `/results/publish?exam_id=${examId}` : '/results/publish';
    const response = await api.post<ApiResponse<void>>(url);
    return response.data;
  },

  // Assignments
  getAssignments: async (filters?: QueryFilters): Promise<PaginatedResponse<Assignment>> => {
    const response = await api.get<PaginatedResponse<Assignment>>('/assignments', { params: filters });
    return response.data;
  },

  getAssignmentById: async (id: number): Promise<ApiResponse<Assignment>> => {
    const response = await api.get<ApiResponse<Assignment>>(`/assignments/${id}`);
    return response.data;
  },

  createAssignment: async (data: Partial<Assignment>): Promise<ApiResponse<Assignment>> => {
    const response = await api.post<ApiResponse<Assignment>>('/assignments', data);
    return response.data;
  },

  updateAssignment: async (id: number, data: Partial<Assignment>): Promise<ApiResponse<Assignment>> => {
    const response = await api.put<ApiResponse<Assignment>>(`/assignments/${id}`, data);
    return response.data;
  },

  deleteAssignment: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/assignments/${id}`);
    return response.data;
  },

  publishAssignment: async (id: number): Promise<ApiResponse<Assignment>> => {
    const response = await api.patch<ApiResponse<Assignment>>(`/assignments/${id}/publish`);
    return response.data;
  },

  // Assignment Submissions
  getSubmissions: async (assignmentId: number): Promise<ApiResponse<AssignmentSubmission[]>> => {
    const response = await api.get<ApiResponse<AssignmentSubmission[]>>(`/assignments/${assignmentId}/submissions`);
    return response.data;
  },

  getMySubmissions: async (): Promise<ApiResponse<AssignmentSubmission[]>> => {
    const response = await api.get<ApiResponse<AssignmentSubmission[]>>('/submissions/my');
    return response.data;
  },

  submitAssignment: async (assignmentId: number, data: Partial<AssignmentSubmission>, files?: File[]): Promise<ApiResponse<AssignmentSubmission>> => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) formData.append(key, String(value));
    });
    files?.forEach(file => formData.append('files', file));
    
    const response = await api.post<ApiResponse<AssignmentSubmission>>(`/assignments/${assignmentId}/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  gradeSubmission: async (submissionId: number, marks: number, grade?: string, remarks?: string): Promise<ApiResponse<AssignmentSubmission>> => {
    const response = await api.patch<ApiResponse<AssignmentSubmission>>(`/submissions/${submissionId}/grade`, {
      marks_obtained: marks,
      grade,
      remarks
    });
    return response.data;
  },

  // Attendance
  getAttendance: async (filters?: QueryFilters): Promise<PaginatedResponse<Attendance>> => {
    const response = await api.get<PaginatedResponse<Attendance>>('/attendance', { params: filters });
    return response.data;
  },

  getMyAttendance: async (subjectId?: number): Promise<ApiResponse<Attendance[]>> => {
    const params = subjectId ? { subject_id: subjectId } : {};
    const response = await api.get<ApiResponse<Attendance[]>>('/attendance/my', { params });
    return response.data;
  },

  getAttendanceSummary: async (studentId?: number): Promise<ApiResponse<AttendanceSummary>> => {
    const url = studentId ? `/attendance/summary/${studentId}` : '/attendance/my/summary';
    const response = await api.get<ApiResponse<AttendanceSummary>>(url);
    return response.data;
  },

  markAttendance: async (data: Partial<Attendance>[]): Promise<ApiResponse<Attendance[]>> => {
    const response = await api.post<ApiResponse<Attendance[]>>('/attendance/bulk', { attendance: data });
    return response.data;
  },

  updateAttendance: async (id: number, status: string, remarks?: string): Promise<ApiResponse<Attendance>> => {
    const response = await api.patch<ApiResponse<Attendance>>(`/attendance/${id}`, { status, remarks });
    return response.data;
  },

  // Timetable
  getTimetables: async (filters?: QueryFilters): Promise<ApiResponse<Timetable[]>> => {
    const response = await api.get<ApiResponse<Timetable[]>>('/timetables', { params: filters });
    return response.data;
  },

  getMyTimetable: async (): Promise<ApiResponse<Timetable[]>> => {
    const response = await api.get<ApiResponse<Timetable[]>>('/timetables/my');
    return response.data;
  },

  getFacultyTimetable: async (facultyId?: number): Promise<ApiResponse<Timetable[]>> => {
    const url = facultyId ? `/timetables/faculty/${facultyId}` : '/timetables/faculty/my';
    const response = await api.get<ApiResponse<Timetable[]>>(url);
    return response.data;
  },

  createTimetable: async (data: Partial<Timetable>): Promise<ApiResponse<Timetable>> => {
    const response = await api.post<ApiResponse<Timetable>>('/timetables', data);
    return response.data;
  },

  updateTimetable: async (id: number, data: Partial<Timetable>): Promise<ApiResponse<Timetable>> => {
    const response = await api.put<ApiResponse<Timetable>>(`/timetables/${id}`, data);
    return response.data;
  },

  deleteTimetable: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/timetables/${id}`);
    return response.data;
  },

  // Internal Marks
  getInternalMarks: async (filters?: QueryFilters): Promise<ApiResponse<InternalMarks[]>> => {
    const response = await api.get<ApiResponse<InternalMarks[]>>('/internal-marks', { params: filters });
    return response.data;
  },

  getMyInternalMarks: async (): Promise<ApiResponse<InternalMarks[]>> => {
    const response = await api.get<ApiResponse<InternalMarks[]>>('/internal-marks/my');
    return response.data;
  },

  addInternalMarks: async (data: Partial<InternalMarks>): Promise<ApiResponse<InternalMarks>> => {
    const response = await api.post<ApiResponse<InternalMarks>>('/internal-marks', data);
    return response.data;
  },

  updateInternalMarks: async (id: number, data: Partial<InternalMarks>): Promise<ApiResponse<InternalMarks>> => {
    const response = await api.put<ApiResponse<InternalMarks>>(`/internal-marks/${id}`, data);
    return response.data;
  },

  publishInternalMarks: async (subjectId?: number): Promise<ApiResponse<void>> => {
    const url = subjectId ? `/internal-marks/publish?subject_id=${subjectId}` : '/internal-marks/publish';
    const response = await api.post<ApiResponse<void>>(url);
    return response.data;
  },
};

export default academicService;
