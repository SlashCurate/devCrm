// ==================== STUDENT SERVICE ====================
import api from '../axios';
import type { 
  Student, 
  AdmissionApplication,
  StudentDocument,
  StudentLeave,
  CertificateRequest,
  Grievance,
  ApiResponse,
  PaginatedResponse,
  QueryFilters 
} from '../../types';

export const studentService = {
  // Students
  getAll: async (filters?: QueryFilters): Promise<PaginatedResponse<Student>> => {
    const response = await api.get<PaginatedResponse<Student>>('/students', { params: filters });
    return response.data;
  },

  getById: async (id: number): Promise<ApiResponse<Student>> => {
    const response = await api.get<ApiResponse<Student>>(`/students/${id}`);
    return response.data;
  },

  getMyProfile: async (): Promise<ApiResponse<Student>> => {
    const response = await api.get<ApiResponse<Student>>('/students/me');
    return response.data;
  },

  create: async (data: Partial<Student>): Promise<ApiResponse<Student>> => {
    const response = await api.post<ApiResponse<Student>>('/students', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Student>): Promise<ApiResponse<Student>> => {
    const response = await api.put<ApiResponse<Student>>(`/students/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/students/${id}`);
    return response.data;
  },

  updateProfile: async (data: Partial<Student>): Promise<ApiResponse<Student>> => {
    const response = await api.put<ApiResponse<Student>>('/students/me', data);
    return response.data;
  },

  getDashboard: async (): Promise<ApiResponse<Record<string, unknown>>> => {
    const response = await api.get<ApiResponse<Record<string, unknown>>>(`/students/dashboard`);
    return response.data;
  },

  // Applications
  getApplications: async (filters?: QueryFilters): Promise<PaginatedResponse<AdmissionApplication>> => {
    const response = await api.get<PaginatedResponse<AdmissionApplication>>('/applications', { params: filters });
    return response.data;
  },

  getMyApplications: async (): Promise<ApiResponse<AdmissionApplication[]>> => {
    const response = await api.get<ApiResponse<AdmissionApplication[]>>('/applications/my');
    return response.data;
  },

  getApplicationById: async (id: number): Promise<ApiResponse<AdmissionApplication>> => {
    const response = await api.get<ApiResponse<AdmissionApplication>>(`/applications/${id}`);
    return response.data;
  },

  submitApplication: async (data: Partial<AdmissionApplication>): Promise<ApiResponse<AdmissionApplication>> => {
    const response = await api.post<ApiResponse<AdmissionApplication>>('/applications', data);
    return response.data;
  },

  updateApplication: async (id: number, data: Partial<AdmissionApplication>): Promise<ApiResponse<AdmissionApplication>> => {
    const response = await api.put<ApiResponse<AdmissionApplication>>(`/applications/${id}`, data);
    return response.data;
  },

  updateApplicationStatus: async (id: number, status: string, remarks?: string): Promise<ApiResponse<AdmissionApplication>> => {
    const response = await api.patch<ApiResponse<AdmissionApplication>>(`/applications/${id}/status`, { 
      status, 
      remarks 
    });
    return response.data;
  },

  // Documents
  getDocuments: async (studentId?: number): Promise<ApiResponse<StudentDocument[]>> => {
    const url = studentId ? `/students/${studentId}/documents` : '/students/me/documents';
    const response = await api.get<ApiResponse<StudentDocument[]>>(url);
    return response.data;
  },

  uploadDocument: async (file: File, documentType: string, studentId?: number): Promise<ApiResponse<StudentDocument>> => {
    const url = studentId ? `/students/${studentId}/documents` : '/students/me/documents';
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);
    const response = await api.post<ApiResponse<StudentDocument>>(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  deleteDocument: async (documentId: number): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/documents/${documentId}`);
    return response.data;
  },

  // Leaves
  getLeaves: async (studentId?: number): Promise<ApiResponse<StudentLeave[]>> => {
    const url = studentId ? `/students/${studentId}/leaves` : '/students/me/leaves';
    const response = await api.get<ApiResponse<StudentLeave[]>>(url);
    return response.data;
  },

  applyLeave: async (data: Partial<StudentLeave>): Promise<ApiResponse<StudentLeave>> => {
    const response = await api.post<ApiResponse<StudentLeave>>('/students/me/leaves', data);
    return response.data;
  },

  updateLeaveStatus: async (leaveId: number, status: string, remarks?: string): Promise<ApiResponse<StudentLeave>> => {
    const response = await api.patch<ApiResponse<StudentLeave>>(`/leaves/${leaveId}/status`, { 
      status, 
      remarks 
    });
    return response.data;
  },

  // Certificates
  getCertificates: async (): Promise<ApiResponse<CertificateRequest[]>> => {
    const response = await api.get<ApiResponse<CertificateRequest[]>>('/students/me/certificates');
    return response.data;
  },

  requestCertificate: async (data: Partial<CertificateRequest>): Promise<ApiResponse<CertificateRequest>> => {
    const response = await api.post<ApiResponse<CertificateRequest>>('/students/me/certificates', data);
    return response.data;
  },

  // Grievances
  getGrievances: async (): Promise<ApiResponse<Grievance[]>> => {
    const response = await api.get<ApiResponse<Grievance[]>>('/students/me/grievances');
    return response.data;
  },

  submitGrievance: async (data: Partial<Grievance>): Promise<ApiResponse<Grievance>> => {
    const response = await api.post<ApiResponse<Grievance>>('/students/me/grievances', data);
    return response.data;
  },

  updateGrievance: async (id: number, data: Partial<Grievance>): Promise<ApiResponse<Grievance>> => {
    const response = await api.put<ApiResponse<Grievance>>(`/grievances/${id}`, data);
    return response.data;
  },
};

export default studentService;
