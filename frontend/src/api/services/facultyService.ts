// ==================== FACULTY SERVICE ====================
import api from '../axios';
import type { 
  Faculty,
  FacultyLeave,
  FacultyAttendance,
  ResearchPublication,
  TeachingWorkload,
  ApiResponse,
  PaginatedResponse,
  QueryFilters 
} from '../../types';

export const facultyService = {
  // Faculty
  getAll: async (filters?: QueryFilters): Promise<PaginatedResponse<Faculty>> => {
    const response = await api.get<PaginatedResponse<Faculty>>('/faculty', { params: filters });
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<Faculty>> => {
    const response = await api.get<ApiResponse<Faculty>>(`/faculty/${id}`);
    return response.data;
  },

  getMyProfile: async (): Promise<ApiResponse<Faculty>> => {
    const response = await api.get<ApiResponse<Faculty>>('/faculty/me');
    return response.data;
  },

  create: async (data: Partial<Faculty>): Promise<ApiResponse<Faculty>> => {
    const response = await api.post<ApiResponse<Faculty>>('/faculty', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Faculty>): Promise<ApiResponse<Faculty>> => {
    const response = await api.put<ApiResponse<Faculty>>(`/faculty/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/faculty/${id}`);
    return response.data;
  },

  updateProfile: async (data: Partial<Faculty>): Promise<ApiResponse<Faculty>> => {
    const response = await api.put<ApiResponse<Faculty>>('/faculty/me', data);
    return response.data;
  },

  getDashboard: async (): Promise<ApiResponse<Record<string, unknown>>> => {
    const response = await api.get<ApiResponse<Record<string, unknown>>>(`/faculty/dashboard`);
    return response.data;
  },

  // Leaves
  getLeaves: async (facultyId?: number): Promise<ApiResponse<FacultyLeave[]>> => {
    const url = facultyId ? `/faculty/${facultyId}/leaves` : '/faculty/me/leaves';
    const response = await api.get<ApiResponse<FacultyLeave[]>>(url);
    return response.data;
  },

  applyLeave: async (data: Partial<FacultyLeave>): Promise<ApiResponse<FacultyLeave>> => {
    const response = await api.post<ApiResponse<FacultyLeave>>('/faculty/me/leaves', data);
    return response.data;
  },

  updateLeaveStatus: async (leaveId: number, status: string, remarks?: string): Promise<ApiResponse<FacultyLeave>> => {
    const response = await api.patch<ApiResponse<FacultyLeave>>(`/faculty/leaves/${leaveId}/status`, { 
      status, 
      remarks 
    });
    return response.data;
  },

  // Attendance
  getAttendance: async (month?: string, year?: number): Promise<ApiResponse<FacultyAttendance[]>> => {
    const params: Record<string, string | number> = {};
    if (month) params.month = month;
    if (year) params.year = year;
    const response = await api.get<ApiResponse<FacultyAttendance[]>>('/faculty/me/attendance', { params });
    return response.data;
  },

  markAttendance: async (status: string, inTime?: string, outTime?: string): Promise<ApiResponse<FacultyAttendance>> => {
    const response = await api.post<ApiResponse<FacultyAttendance>>('/faculty/me/attendance', {
      status,
      in_time: inTime,
      out_time: outTime
    });
    return response.data;
  },

  // Research Publications
  getPublications: async (facultyId?: number): Promise<ApiResponse<ResearchPublication[]>> => {
    const url = facultyId ? `/faculty/${facultyId}/publications` : '/faculty/me/publications';
    const response = await api.get<ApiResponse<ResearchPublication[]>>(url);
    return response.data;
  },

  addPublication: async (data: Partial<ResearchPublication>): Promise<ApiResponse<ResearchPublication>> => {
    const response = await api.post<ApiResponse<ResearchPublication>>('/faculty/me/publications', data);
    return response.data;
  },

  updatePublication: async (id: number, data: Partial<ResearchPublication>): Promise<ApiResponse<ResearchPublication>> => {
    const response = await api.put<ApiResponse<ResearchPublication>>(`/faculty/publications/${id}`, data);
    return response.data;
  },

  deletePublication: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/faculty/publications/${id}`);
    return response.data;
  },

  // Workload
  getWorkload: async (semesterId?: number): Promise<ApiResponse<TeachingWorkload>> => {
    const params = semesterId ? { semester_id: semesterId } : {};
    const response = await api.get<ApiResponse<TeachingWorkload>>('/faculty/me/workload', { params });
    return response.data;
  },

  assignWorkload: async (facultyId: number, data: Partial<TeachingWorkload>): Promise<ApiResponse<TeachingWorkload>> => {
    const response = await api.post<ApiResponse<TeachingWorkload>>(`/faculty/${facultyId}/workload`, data);
    return response.data;
  },
};

export default facultyService;
