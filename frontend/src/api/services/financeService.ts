// ==================== FINANCE SERVICE ====================
import api from '../axios';
import type { 
  FeeCategory,
  FeeStructure,
  StudentFeeInvoice,
  Payment,
  Scholarship,
  ScholarshipApplication,
  ApiResponse,
  PaginatedResponse,
  QueryFilters 
} from '../../types';

export const financeService = {
  // Fee Categories
  getCategories: async (): Promise<ApiResponse<FeeCategory[]>> => {
    const response = await api.get<ApiResponse<FeeCategory[]>>('/fee-categories');
    return response.data;
  },

  createCategory: async (data: Partial<FeeCategory>): Promise<ApiResponse<FeeCategory>> => {
    const response = await api.post<ApiResponse<FeeCategory>>('/fee-categories', data);
    return response.data;
  },

  updateCategory: async (id: number, data: Partial<FeeCategory>): Promise<ApiResponse<FeeCategory>> => {
    const response = await api.put<ApiResponse<FeeCategory>>(`/fee-categories/${id}`, data);
    return response.data;
  },

  deleteCategory: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/fee-categories/${id}`);
    return response.data;
  },

  // Fee Structures
  getFeeStructures: async (filters?: QueryFilters): Promise<PaginatedResponse<FeeStructure>> => {
    const response = await api.get<PaginatedResponse<FeeStructure>>('/fee-structures', { params: filters });
    return response.data;
  },

  getFeeStructureById: async (id: number): Promise<ApiResponse<FeeStructure>> => {
    const response = await api.get<ApiResponse<FeeStructure>>(`/fee-structures/${id}`);
    return response.data;
  },

  createFeeStructure: async (data: Partial<FeeStructure>): Promise<ApiResponse<FeeStructure>> => {
    const response = await api.post<ApiResponse<FeeStructure>>('/fee-structures', data);
    return response.data;
  },

  updateFeeStructure: async (id: number, data: Partial<FeeStructure>): Promise<ApiResponse<FeeStructure>> => {
    const response = await api.put<ApiResponse<FeeStructure>>(`/fee-structures/${id}`, data);
    return response.data;
  },

  deleteFeeStructure: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/fee-structures/${id}`);
    return response.data;
  },

  // Student Fee Invoices
  getInvoices: async (filters?: QueryFilters): Promise<PaginatedResponse<StudentFeeInvoice>> => {
    const response = await api.get<PaginatedResponse<StudentFeeInvoice>>('/invoices', { params: filters });
    return response.data;
  },

  getMyInvoices: async (): Promise<ApiResponse<StudentFeeInvoice[]>> => {
    const response = await api.get<ApiResponse<StudentFeeInvoice[]>>('/invoices/my');
    return response.data;
  },

  getInvoiceById: async (id: number): Promise<ApiResponse<StudentFeeInvoice>> => {
    const response = await api.get<ApiResponse<StudentFeeInvoice>>(`/invoices/${id}`);
    return response.data;
  },

  createInvoice: async (data: Partial<StudentFeeInvoice>): Promise<ApiResponse<StudentFeeInvoice>> => {
    const response = await api.post<ApiResponse<StudentFeeInvoice>>('/invoices', data);
    return response.data;
  },

  generateInvoices: async (programId: number, semesterId: number): Promise<ApiResponse<StudentFeeInvoice[]>> => {
    const response = await api.post<ApiResponse<StudentFeeInvoice[]>>('/invoices/generate', {
      program_id: programId,
      semester_id: semesterId
    });
    return response.data;
  },

  // Payments
  getPayments: async (filters?: QueryFilters): Promise<PaginatedResponse<Payment>> => {
    const response = await api.get<PaginatedResponse<Payment>>('/payments', { params: filters });
    return response.data;
  },

  getMyPayments: async (): Promise<ApiResponse<Payment[]>> => {
    const response = await api.get<ApiResponse<Payment[]>>('/payments/my');
    return response.data;
  },

  getPaymentById: async (id: number): Promise<ApiResponse<Payment>> => {
    const response = await api.get<ApiResponse<Payment>>(`/payments/${id}`);
    return response.data;
  },

  createPaymentOrder: async (invoiceId: number): Promise<ApiResponse<{ order_id: string; amount: number; key_id: string }>> => {
    const response = await api.post<ApiResponse<{ order_id: string; amount: number; key_id: string }>>('/payments/order', {
      invoice_id: invoiceId
    });
    return response.data;
  },

  verifyPayment: async (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Promise<ApiResponse<Payment>> => {
    const response = await api.post<ApiResponse<Payment>>('/payments/verify', data);
    return response.data;
  },

  recordPayment: async (data: Partial<Payment>): Promise<ApiResponse<Payment>> => {
    const response = await api.post<ApiResponse<Payment>>('/payments/record', data);
    return response.data;
  },

  getPendingFees: async (): Promise<ApiResponse<StudentFeeInvoice[]>> => {
    const response = await api.get<ApiResponse<StudentFeeInvoice[]>>('/payments/pending');
    return response.data;
  },

  getReceipt: async (paymentId: number): Promise<ApiResponse<Payment>> => {
    const response = await api.get<ApiResponse<Payment>>(`/payments/${paymentId}/receipt`);
    return response.data;
  },

  // Scholarships
  getScholarships: async (): Promise<ApiResponse<Scholarship[]>> => {
    const response = await api.get<ApiResponse<Scholarship[]>>('/scholarships');
    return response.data;
  },

  createScholarship: async (data: Partial<Scholarship>): Promise<ApiResponse<Scholarship>> => {
    const response = await api.post<ApiResponse<Scholarship>>('/scholarships', data);
    return response.data;
  },

  updateScholarship: async (id: number, data: Partial<Scholarship>): Promise<ApiResponse<Scholarship>> => {
    const response = await api.put<ApiResponse<Scholarship>>(`/scholarships/${id}`, data);
    return response.data;
  },

  deleteScholarship: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/scholarships/${id}`);
    return response.data;
  },

  // Scholarship Applications
  getScholarshipApplications: async (scholarshipId?: number): Promise<ApiResponse<ScholarshipApplication[]>> => {
    const params = scholarshipId ? { scholarship_id: scholarshipId } : {};
    const response = await api.get<ApiResponse<ScholarshipApplication[]>>('/scholarship-applications', { params });
    return response.data;
  },

  getMyScholarshipApplications: async (): Promise<ApiResponse<ScholarshipApplication[]>> => {
    const response = await api.get<ApiResponse<ScholarshipApplication[]>>('/scholarship-applications/my');
    return response.data;
  },

  applyForScholarship: async (scholarshipId: number, data: Partial<ScholarshipApplication>): Promise<ApiResponse<ScholarshipApplication>> => {
    const response = await api.post<ApiResponse<ScholarshipApplication>>(`/scholarships/${scholarshipId}/apply`, data);
    return response.data;
  },

  updateScholarshipApplication: async (id: number, data: Partial<ScholarshipApplication>): Promise<ApiResponse<ScholarshipApplication>> => {
    const response = await api.put<ApiResponse<ScholarshipApplication>>(`/scholarship-applications/${id}`, data);
    return response.data;
  },

  approveScholarship: async (applicationId: number, approvedAmount: number): Promise<ApiResponse<ScholarshipApplication>> => {
    const response = await api.patch<ApiResponse<ScholarshipApplication>>(`/scholarship-applications/${applicationId}/approve`, {
      approved_amount: approvedAmount
    });
    return response.data;
  },

  // Dashboard & Reports
  getFinanceDashboard: async (): Promise<ApiResponse<Record<string, unknown>>> => {
    const response = await api.get<ApiResponse<Record<string, unknown>>>('/finance/dashboard');
    return response.data;
  },

  getCollectionReport: async (fromDate: string, toDate: string): Promise<ApiResponse<Record<string, unknown>>> => {
    const response = await api.get<ApiResponse<Record<string, unknown>>>('/finance/collection-report', {
      params: { from_date: fromDate, to_date: toDate }
    });
    return response.data;
  },

  getOutstandingReport: async (): Promise<ApiResponse<Record<string, unknown>[]>> => {
    const response = await api.get<ApiResponse<Record<string, unknown>[]>>(`/finance/outstanding-report`);
    return response.data;
  },
};

export default financeService;
