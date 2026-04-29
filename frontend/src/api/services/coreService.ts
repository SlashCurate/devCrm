// ==================== CORE SERVICE (University, College, Department, Program) ====================
import api from '../axios';
import type { 
  University, 
  College, 
  Department, 
  Program, 
  Subject,
  AcademicYear,
  Semester,
  Notice,
  Event,
  Holiday,
  ApiResponse,
  PaginatedResponse,
  QueryFilters 
} from '../../types';

// University
export const universityService = {
  getAll: async (): Promise<ApiResponse<University[]>> => {
    const response = await api.get<ApiResponse<University[]>>('/universities');
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<University>> => {
    const response = await api.get<ApiResponse<University>>(`/universities/${id}`);
    return response.data;
  },

  create: async (data: Partial<University>): Promise<ApiResponse<University>> => {
    const response = await api.post<ApiResponse<University>>('/universities', data);
    return response.data;
  },

  update: async (id: number, data: Partial<University>): Promise<ApiResponse<University>> => {
    const response = await api.put<ApiResponse<University>>(`/universities/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/universities/${id}`);
    return response.data;
  },

  getDashboard: async (): Promise<ApiResponse<Record<string, unknown>>> => {
    const response = await api.get<ApiResponse<Record<string, unknown>>>('/universities/dashboard');
    return response.data;
  },
};

// College
export const collegeService = {
  getAll: async (filters?: QueryFilters): Promise<PaginatedResponse<College>> => {
    const response = await api.get<PaginatedResponse<College>>('/colleges', { params: filters });
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<College>> => {
    const response = await api.get<ApiResponse<College>>(`/colleges/${id}`);
    return response.data;
  },

  create: async (data: Partial<College>): Promise<ApiResponse<College>> => {
    const response = await api.post<ApiResponse<College>>('/colleges', data);
    return response.data;
  },

  update: async (id: number, data: Partial<College>): Promise<ApiResponse<College>> => {
    const response = await api.put<ApiResponse<College>>(`/colleges/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/colleges/${id}`);
    return response.data;
  },

  getDashboard: async (): Promise<ApiResponse<Record<string, unknown>>> => {
    const response = await api.get<ApiResponse<Record<string, unknown>>>('/colleges/dashboard');
    return response.data;
  },

  getStats: async (id: number): Promise<ApiResponse<Record<string, unknown>>> => {
    const response = await api.get<ApiResponse<Record<string, unknown>>>(`/colleges/${id}/stats`);
    return response.data;
  },
};

// Department
export const departmentService = {
  getAll: async (collegeId?: number): Promise<ApiResponse<Department[]>> => {
    const params = collegeId ? { college_id: collegeId } : {};
    const response = await api.get<ApiResponse<Department[]>>('/departments', { params });
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<Department>> => {
    const response = await api.get<ApiResponse<Department>>(`/departments/${id}`);
    return response.data;
  },

  create: async (data: Partial<Department>): Promise<ApiResponse<Department>> => {
    const response = await api.post<ApiResponse<Department>>('/departments', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Department>): Promise<ApiResponse<Department>> => {
    const response = await api.put<ApiResponse<Department>>(`/departments/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/departments/${id}`);
    return response.data;
  },

  assignHOD: async (id: number, facultyId: number): Promise<ApiResponse<Department>> => {
    const response = await api.patch<ApiResponse<Department>>(`/departments/${id}/hod`, { 
      hod_id: facultyId 
    });
    return response.data;
  },
};

// Program
export const programService = {
  getAll: async (filters?: QueryFilters): Promise<PaginatedResponse<Program>> => {
    const response = await api.get<PaginatedResponse<Program>>('/programs', { params: filters });
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<Program>> => {
    const response = await api.get<ApiResponse<Program>>(`/programs/${id}`);
    return response.data;
  },

  create: async (data: Partial<Program>): Promise<ApiResponse<Program>> => {
    const response = await api.post<ApiResponse<Program>>('/programs', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Program>): Promise<ApiResponse<Program>> => {
    const response = await api.put<ApiResponse<Program>>(`/programs/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/programs/${id}`);
    return response.data;
  },

  getSubjects: async (id: number): Promise<ApiResponse<Subject[]>> => {
    const response = await api.get<ApiResponse<Subject[]>>(`/programs/${id}/subjects`);
    return response.data;
  },

  // Backward compatible alias
  getCourses: async (filters?: QueryFilters): Promise<PaginatedResponse<Program>> => {
    return programService.getAll(filters);
  },
};

// Subject
export const subjectService = {
  getAll: async (filters?: QueryFilters): Promise<PaginatedResponse<Subject>> => {
    const response = await api.get<PaginatedResponse<Subject>>('/subjects', { params: filters });
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<Subject>> => {
    const response = await api.get<ApiResponse<Subject>>(`/subjects/${id}`);
    return response.data;
  },

  create: async (data: Partial<Subject>): Promise<ApiResponse<Subject>> => {
    const response = await api.post<ApiResponse<Subject>>('/subjects', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Subject>): Promise<ApiResponse<Subject>> => {
    const response = await api.put<ApiResponse<Subject>>(`/subjects/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/subjects/${id}`);
    return response.data;
  },
};

// Academic Year
export const academicYearService = {
  getAll: async (): Promise<ApiResponse<AcademicYear[]>> => {
    const response = await api.get<ApiResponse<AcademicYear[]>>('/academic-years');
    return response.data;
  },

  getCurrent: async (): Promise<ApiResponse<AcademicYear>> => {
    const response = await api.get<ApiResponse<AcademicYear>>('/academic-years/current');
    return response.data;
  },

  create: async (data: Partial<AcademicYear>): Promise<ApiResponse<AcademicYear>> => {
    const response = await api.post<ApiResponse<AcademicYear>>('/academic-years', data);
    return response.data;
  },

  update: async (id: number, data: Partial<AcademicYear>): Promise<ApiResponse<AcademicYear>> => {
    const response = await api.put<ApiResponse<AcademicYear>>(`/academic-years/${id}`, data);
    return response.data;
  },

  setCurrent: async (id: number): Promise<ApiResponse<AcademicYear>> => {
    const response = await api.patch<ApiResponse<AcademicYear>>(`/academic-years/${id}/set-current`);
    return response.data;
  },
};

// Semester
export const semesterService = {
  getAll: async (academicYearId?: number): Promise<ApiResponse<Semester[]>> => {
    const params = academicYearId ? { academic_year_id: academicYearId } : {};
    const response = await api.get<ApiResponse<Semester[]>>('/semesters', { params });
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<Semester>> => {
    const response = await api.get<ApiResponse<Semester>>(`/semesters/${id}`);
    return response.data;
  },

  create: async (data: Partial<Semester>): Promise<ApiResponse<Semester>> => {
    const response = await api.post<ApiResponse<Semester>>('/semesters', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Semester>): Promise<ApiResponse<Semester>> => {
    const response = await api.put<ApiResponse<Semester>>(`/semesters/${id}`, data);
    return response.data;
  },
};

// Notices
export const noticeService = {
  getAll: async (filters?: QueryFilters): Promise<PaginatedResponse<Notice>> => {
    const response = await api.get<PaginatedResponse<Notice>>('/notices', { params: filters });
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<Notice>> => {
    const response = await api.get<ApiResponse<Notice>>(`/notices/${id}`);
    return response.data;
  },

  create: async (data: Partial<Notice>): Promise<ApiResponse<Notice>> => {
    const response = await api.post<ApiResponse<Notice>>('/notices', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Notice>): Promise<ApiResponse<Notice>> => {
    const response = await api.put<ApiResponse<Notice>>(`/notices/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/notices/${id}`);
    return response.data;
  },

  togglePin: async (id: number): Promise<ApiResponse<Notice>> => {
    const response = await api.patch<ApiResponse<Notice>>(`/notices/${id}/toggle-pin`);
    return response.data;
  },
};

// Events
export const eventService = {
  getAll: async (filters?: QueryFilters): Promise<PaginatedResponse<Event>> => {
    const response = await api.get<PaginatedResponse<Event>>('/events', { params: filters });
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<Event>> => {
    const response = await api.get<ApiResponse<Event>>(`/events/${id}`);
    return response.data;
  },

  create: async (data: Partial<Event>): Promise<ApiResponse<Event>> => {
    const response = await api.post<ApiResponse<Event>>('/events', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Event>): Promise<ApiResponse<Event>> => {
    const response = await api.put<ApiResponse<Event>>(`/events/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/events/${id}`);
    return response.data;
  },
};

// Holidays
export const holidayService = {
  getAll: async (year?: number): Promise<ApiResponse<Holiday[]>> => {
    const params = year ? { year } : {};
    const response = await api.get<ApiResponse<Holiday[]>>('/holidays', { params });
    return response.data;
  },

  create: async (data: Partial<Holiday>): Promise<ApiResponse<Holiday>> => {
    const response = await api.post<ApiResponse<Holiday>>('/holidays', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Holiday>): Promise<ApiResponse<Holiday>> => {
    const response = await api.put<ApiResponse<Holiday>>(`/holidays/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/holidays/${id}`);
    return response.data;
  },
};

export default {
  university: universityService,
  college: collegeService,
  department: departmentService,
  program: programService,
  subject: subjectService,
  academicYear: academicYearService,
  semester: semesterService,
  notice: noticeService,
  event: eventService,
  holiday: holidayService,
};
