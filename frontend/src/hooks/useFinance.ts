// ==================== FINANCE HOOKS ====================
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeService } from '../api/services';
import type { 
  FeeCategory,
  FeeStructure,
  StudentFeeInvoice,
  Payment,
  Scholarship,
  ScholarshipApplication,
  QueryFilters 
} from '../types';

export const financeKeys = {
  all: ['finance'] as const,
  categories: () => [...financeKeys.all, 'categories'] as const,
  feeStructures: (filters?: QueryFilters) => [...financeKeys.all, 'feeStructures', filters] as const,
  feeStructureDetail: (id: number) => [...financeKeys.all, 'feeStructures', id] as const,
  invoices: (filters?: QueryFilters) => [...financeKeys.all, 'invoices', filters] as const,
  myInvoices: () => [...financeKeys.all, 'myInvoices'] as const,
  invoiceDetail: (id: number) => [...financeKeys.all, 'invoices', id] as const,
  payments: (filters?: QueryFilters) => [...financeKeys.all, 'payments', filters] as const,
  myPayments: () => [...financeKeys.all, 'myPayments'] as const,
  pendingFees: () => [...financeKeys.all, 'pendingFees'] as const,
  scholarships: () => [...financeKeys.all, 'scholarships'] as const,
  scholarshipDetail: (id: number) => [...financeKeys.all, 'scholarships', id] as const,
  scholarshipApplications: (scholarshipId?: number) => [...financeKeys.all, 'scholarshipApplications', scholarshipId] as const,
  myScholarshipApplications: () => [...financeKeys.all, 'myScholarshipApplications'] as const,
  dashboard: () => [...financeKeys.all, 'dashboard'] as const,
};

// ============== FEE CATEGORIES ==============

export const useFeeCategories = () => {
  return useQuery({
    queryKey: financeKeys.categories(),
    queryFn: financeService.getCategories,
    select: (res) => res.data,
  });
};

export const useCreateFeeCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: financeService.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.categories() });
    },
  });
};

export const useUpdateFeeCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<FeeCategory> }) => 
      financeService.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.categories() });
    },
  });
};

export const useDeleteFeeCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: financeService.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.categories() });
    },
  });
};

// ============== FEE STRUCTURES ==============

export const useFeeStructures = (filters?: QueryFilters) => {
  return useQuery({
    queryKey: financeKeys.feeStructures(filters),
    queryFn: () => financeService.getFeeStructures(filters),
    select: (res) => ({ data: res.data, meta: res.meta }),
  });
};

export const useFeeStructure = (id: number) => {
  return useQuery({
    queryKey: financeKeys.feeStructureDetail(id),
    queryFn: () => financeService.getFeeStructureById(id),
    select: (res) => res.data,
    enabled: !!id,
  });
};

export const useCreateFeeStructure = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: financeService.createFeeStructure,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.feeStructures() });
    },
  });
};

export const useUpdateFeeStructure = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<FeeStructure> }) => 
      financeService.updateFeeStructure(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: financeKeys.feeStructureDetail(id) });
      queryClient.invalidateQueries({ queryKey: financeKeys.feeStructures() });
    },
  });
};

export const useDeleteFeeStructure = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: financeService.deleteFeeStructure,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.feeStructures() });
    },
  });
};

// ============== STUDENT FEE INVOICES ==============

export const useInvoices = (filters?: QueryFilters) => {
  return useQuery({
    queryKey: financeKeys.invoices(filters),
    queryFn: () => financeService.getInvoices(filters),
    select: (res) => ({ data: res.data, meta: res.meta }),
  });
};

export const useMyInvoices = () => {
  return useQuery({
    queryKey: financeKeys.myInvoices(),
    queryFn: financeService.getMyInvoices,
    select: (res) => res.data,
  });
};

export const useInvoice = (id: number) => {
  return useQuery({
    queryKey: financeKeys.invoiceDetail(id),
    queryFn: () => financeService.getInvoiceById(id),
    select: (res) => res.data,
    enabled: !!id,
  });
};

export const useCreateInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: financeService.createInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.invoices() });
    },
  });
};

export const useGenerateInvoices = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ programId, semesterId }: { programId: number; semesterId: number }) => 
      financeService.generateInvoices(programId, semesterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.invoices() });
    },
  });
};

// ============== PAYMENTS ==============

export const usePayments = (filters?: QueryFilters) => {
  return useQuery({
    queryKey: financeKeys.payments(filters),
    queryFn: () => financeService.getPayments(filters),
    select: (res) => ({ data: res.data, meta: res.meta }),
  });
};

export const useMyPayments = () => {
  return useQuery({
    queryKey: financeKeys.myPayments(),
    queryFn: financeService.getMyPayments,
    select: (res) => res.data,
  });
};

export const usePayment = (id: number) => {
  return useQuery({
    queryKey: [...financeKeys.all, 'payment', id],
    queryFn: () => financeService.getPaymentById(id),
    select: (res) => res.data,
    enabled: !!id,
  });
};

export const usePendingFees = () => {
  return useQuery({
    queryKey: financeKeys.pendingFees(),
    queryFn: financeService.getPendingFees,
    select: (res) => res.data,
  });
};

export const useCreatePaymentOrder = () => {
  return useMutation({
    mutationFn: financeService.createPaymentOrder,
  });
};

export const useVerifyPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: financeService.verifyPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.myPayments() });
      queryClient.invalidateQueries({ queryKey: financeKeys.myInvoices() });
      queryClient.invalidateQueries({ queryKey: financeKeys.pendingFees() });
    },
  });
};

export const useRecordPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: financeService.recordPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.payments() });
      queryClient.invalidateQueries({ queryKey: financeKeys.invoices() });
    },
  });
};

export const usePaymentReceipt = (paymentId: number) => {
  return useQuery({
    queryKey: [...financeKeys.all, 'receipt', paymentId],
    queryFn: () => financeService.getReceipt(paymentId),
    select: (res) => res.data,
    enabled: !!paymentId,
  });
};

// ============== SCHOLARSHIPS ==============

export const useScholarships = () => {
  return useQuery({
    queryKey: financeKeys.scholarships(),
    queryFn: financeService.getScholarships,
    select: (res) => res.data,
  });
};

export const useScholarship = (id: number) => {
  return useQuery({
    queryKey: financeKeys.scholarshipDetail(id),
    queryFn: () => financeService.getScholarships().then(res => res.data?.find(s => s.id === id)),
    enabled: !!id,
  });
};

export const useCreateScholarship = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: financeService.createScholarship,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.scholarships() });
    },
  });
};

export const useUpdateScholarship = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Scholarship> }) => 
      financeService.updateScholarship(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: financeKeys.scholarshipDetail(id) });
      queryClient.invalidateQueries({ queryKey: financeKeys.scholarships() });
    },
  });
};

export const useDeleteScholarship = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: financeService.deleteScholarship,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.scholarships() });
    },
  });
};

// ============== SCHOLARSHIP APPLICATIONS ==============

export const useScholarshipApplications = (scholarshipId?: number) => {
  return useQuery({
    queryKey: financeKeys.scholarshipApplications(scholarshipId),
    queryFn: () => financeService.getScholarshipApplications(scholarshipId),
    select: (res) => res.data,
  });
};

export const useMyScholarshipApplications = () => {
  return useQuery({
    queryKey: financeKeys.myScholarshipApplications(),
    queryFn: financeService.getMyScholarshipApplications,
    select: (res) => res.data,
  });
};

export const useApplyForScholarship = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ scholarshipId, data }: { scholarshipId: number; data: Partial<ScholarshipApplication> }) => 
      financeService.applyForScholarship(scholarshipId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.myScholarshipApplications() });
    },
  });
};

export const useApproveScholarship = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ applicationId, approvedAmount }: { applicationId: number; approvedAmount: number }) => 
      financeService.approveScholarship(applicationId, approvedAmount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.scholarshipApplications() });
    },
  });
};

// ============== REPORTS ==============

export const useFinanceDashboard = () => {
  return useQuery({
    queryKey: financeKeys.dashboard(),
    queryFn: financeService.getFinanceDashboard,
    select: (res) => res.data,
  });
};

export const useCollectionReport = (fromDate: string, toDate: string) => {
  return useQuery({
    queryKey: [...financeKeys.all, 'collectionReport', fromDate, toDate],
    queryFn: () => financeService.getCollectionReport(fromDate, toDate),
    select: (res) => res.data,
    enabled: !!fromDate && !!toDate,
  });
};

export const useOutstandingReport = () => {
  return useQuery({
    queryKey: [...financeKeys.all, 'outstandingReport'],
    queryFn: financeService.getOutstandingReport,
    select: (res) => res.data,
  });
};
