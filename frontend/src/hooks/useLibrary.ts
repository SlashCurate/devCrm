// ==================== LIBRARY HOOKS ====================
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { libraryService } from '../api/services';
import type { 
  Book,
  BookBorrowing,
  LibraryMember,
  BookReservation,
  EResource,
  QueryFilters 
} from '../types';

export const libraryKeys = {
  all: ['library'] as const,
  books: (filters?: QueryFilters) => [...libraryKeys.all, 'books', filters] as const,
  bookDetail: (id: number) => [...libraryKeys.all, 'books', id] as const,
  bookSearch: (query: string) => [...libraryKeys.all, 'search', query] as const,
  borrowings: (filters?: QueryFilters) => [...libraryKeys.all, 'borrowings', filters] as const,
  myBorrowings: () => [...libraryKeys.all, 'myBorrowings'] as const,
  reservations: () => [...libraryKeys.all, 'reservations'] as const,
  myReservations: () => [...libraryKeys.all, 'myReservations'] as const,
  members: (filters?: QueryFilters) => [...libraryKeys.all, 'members', filters] as const,
  memberDetail: (id: number) => [...libraryKeys.all, 'members', id] as const,
  eResources: (filters?: QueryFilters) => [...libraryKeys.all, 'eResources', filters] as const,
  dashboard: () => [...libraryKeys.all, 'dashboard'] as const,
  overdue: () => [...libraryKeys.all, 'overdue'] as const,
};

// ============== BOOKS ==============

export const useBooks = (filters?: QueryFilters) => {
  return useQuery({
    queryKey: libraryKeys.books(filters),
    queryFn: () => libraryService.getBooks(filters),
    select: (res) => ({ data: res.data, meta: res.meta }),
  });
};

export const useBook = (id: number) => {
  return useQuery({
    queryKey: libraryKeys.bookDetail(id),
    queryFn: () => libraryService.getBookById(id),
    select: (res) => res.data,
    enabled: !!id,
  });
};

export const useSearchBooks = (query: string) => {
  return useQuery({
    queryKey: libraryKeys.bookSearch(query),
    queryFn: () => libraryService.searchBooks(query),
    select: (res) => res.data,
    enabled: query.length > 2,
  });
};

export const useCreateBook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: libraryService.createBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.books() });
    },
  });
};

export const useUpdateBook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Book> }) => 
      libraryService.updateBook(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.bookDetail(id) });
      queryClient.invalidateQueries({ queryKey: libraryKeys.books() });
    },
  });
};

export const useDeleteBook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: libraryService.deleteBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.books() });
    },
  });
};

// ============== BORROWINGS ==============

export const useBorrowings = (filters?: QueryFilters) => {
  return useQuery({
    queryKey: libraryKeys.borrowings(filters),
    queryFn: () => libraryService.getBorrowings(filters),
    select: (res) => ({ data: res.data, meta: res.meta }),
  });
};

export const useMyBorrowings = () => {
  return useQuery({
    queryKey: libraryKeys.myBorrowings(),
    queryFn: libraryService.getMyBorrowings,
    select: (res) => res.data,
  });
};

export const useIssueBook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookId, userType, userId }: { bookId: number; userType: 'Student' | 'Faculty'; userId: number }) => 
      libraryService.issueBook(bookId, userType, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.borrowings() });
      queryClient.invalidateQueries({ queryKey: libraryKeys.myBorrowings() });
      queryClient.invalidateQueries({ queryKey: libraryKeys.books() });
    },
  });
};

export const useReturnBook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: libraryService.returnBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.borrowings() });
      queryClient.invalidateQueries({ queryKey: libraryKeys.myBorrowings() });
      queryClient.invalidateQueries({ queryKey: libraryKeys.books() });
    },
  });
};

export const useRenewBook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: libraryService.renewBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.myBorrowings() });
    },
  });
};

// ============== RESERVATIONS ==============

export const useReservations = () => {
  return useQuery({
    queryKey: libraryKeys.reservations(),
    queryFn: libraryService.getReservations,
    select: (res) => res.data,
  });
};

export const useMyReservations = () => {
  return useQuery({
    queryKey: libraryKeys.myReservations(),
    queryFn: libraryService.getMyReservations,
    select: (res) => res.data,
  });
};

export const useReserveBook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: libraryService.reserveBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.myReservations() });
    },
  });
};

export const useCancelReservation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: libraryService.cancelReservation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.myReservations() });
    },
  });
};

// ============== LIBRARY MEMBERS ==============

export const useLibraryMembers = (filters?: QueryFilters) => {
  return useQuery({
    queryKey: libraryKeys.members(filters),
    queryFn: () => libraryService.getMembers(filters),
    select: (res) => ({ data: res.data, meta: res.meta }),
  });
};

export const useLibraryMember = (id: number) => {
  return useQuery({
    queryKey: libraryKeys.memberDetail(id),
    queryFn: () => libraryService.getMemberById(id),
    select: (res) => res.data,
    enabled: !!id,
  });
};

export const useCreateLibraryMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: libraryService.createMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.members() });
    },
  });
};

export const useBlockMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, reason }: { memberId: number; reason: string }) => 
      libraryService.blockMember(memberId, reason),
    onSuccess: (_, { memberId }) => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.memberDetail(memberId) });
    },
  });
};

export const useUnblockMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: libraryService.unblockMember,
    onSuccess: (_, memberId) => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.memberDetail(memberId) });
    },
  });
};

// ============== E-RESOURCES ==============

export const useEResources = (filters?: QueryFilters) => {
  return useQuery({
    queryKey: libraryKeys.eResources(filters),
    queryFn: () => libraryService.getEResources(filters),
    select: (res) => ({ data: res.data, meta: res.meta }),
  });
};

export const useCreateEResource = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: libraryService.createEResource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.eResources() });
    },
  });
};

export const useUpdateEResource = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<EResource> }) => 
      libraryService.updateEResource(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.eResources() });
    },
  });
};

export const useDeleteEResource = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: libraryService.deleteEResource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.eResources() });
    },
  });
};

// ============== DASHBOARD & REPORTS ==============

export const useLibraryDashboard = () => {
  return useQuery({
    queryKey: libraryKeys.dashboard(),
    queryFn: libraryService.getDashboard,
    select: (res) => res.data,
  });
};

export const useOverdueBooks = () => {
  return useQuery({
    queryKey: libraryKeys.overdue(),
    queryFn: libraryService.getOverdueBooks,
    select: (res) => res.data,
  });
};
