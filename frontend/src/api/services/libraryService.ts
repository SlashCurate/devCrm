// ==================== LIBRARY SERVICE ====================
import api from '../axios';
import type { 
  Book,
  BookBorrowing,
  LibraryMember,
  BookReservation,
  EResource,
  ApiResponse,
  PaginatedResponse,
  QueryFilters 
} from '../../types';

export const libraryService = {
  // Books
  getBooks: async (filters?: QueryFilters): Promise<PaginatedResponse<Book>> => {
    const response = await api.get<PaginatedResponse<Book>>('/books', { params: filters });
    return response.data;
  },

  getBookById: async (id: number): Promise<ApiResponse<Book>> => {
    const response = await api.get<ApiResponse<Book>>(`/books/${id}`);
    return response.data;
  },

  searchBooks: async (query: string): Promise<ApiResponse<Book[]>> => {
    const response = await api.get<ApiResponse<Book[]>>(`/books/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  createBook: async (data: Partial<Book>): Promise<ApiResponse<Book>> => {
    const response = await api.post<ApiResponse<Book>>('/books', data);
    return response.data;
  },

  updateBook: async (id: number, data: Partial<Book>): Promise<ApiResponse<Book>> => {
    const response = await api.put<ApiResponse<Book>>(`/books/${id}`, data);
    return response.data;
  },

  deleteBook: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/books/${id}`);
    return response.data;
  },

  // Borrowing
  getBorrowings: async (filters?: QueryFilters): Promise<PaginatedResponse<BookBorrowing>> => {
    const response = await api.get<PaginatedResponse<BookBorrowing>>('/borrowings', { params: filters });
    return response.data;
  },

  getMyBorrowings: async (): Promise<ApiResponse<BookBorrowing[]>> => {
    const response = await api.get<ApiResponse<BookBorrowing[]>>('/borrowings/my');
    return response.data;
  },

  issueBook: async (bookId: number, userType: 'Student' | 'Faculty', userId: number): Promise<ApiResponse<BookBorrowing>> => {
    const response = await api.post<ApiResponse<BookBorrowing>>('/borrowings', {
      book_id: bookId,
      user_type: userType,
      user_id: userId
    });
    return response.data;
  },

  returnBook: async (borrowingId: number): Promise<ApiResponse<BookBorrowing>> => {
    const response = await api.post<ApiResponse<BookBorrowing>>(`/borrowings/${borrowingId}/return`);
    return response.data;
  },

  renewBook: async (borrowingId: number): Promise<ApiResponse<BookBorrowing>> => {
    const response = await api.post<ApiResponse<BookBorrowing>>(`/borrowings/${borrowingId}/renew`);
    return response.data;
  },

  // Reservations
  getReservations: async (): Promise<ApiResponse<BookReservation[]>> => {
    const response = await api.get<ApiResponse<BookReservation[]>>('/reservations');
    return response.data;
  },

  getMyReservations: async (): Promise<ApiResponse<BookReservation[]>> => {
    const response = await api.get<ApiResponse<BookReservation[]>>('/reservations/my');
    return response.data;
  },

  reserveBook: async (bookId: number): Promise<ApiResponse<BookReservation>> => {
    const response = await api.post<ApiResponse<BookReservation>>('/reservations', { book_id: bookId });
    return response.data;
  },

  cancelReservation: async (reservationId: number): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/reservations/${reservationId}`);
    return response.data;
  },

  // Library Members
  getMembers: async (filters?: QueryFilters): Promise<PaginatedResponse<LibraryMember>> => {
    const response = await api.get<PaginatedResponse<LibraryMember>>('/library-members', { params: filters });
    return response.data;
  },

  getMemberById: async (id: number): Promise<ApiResponse<LibraryMember>> => {
    const response = await api.get<ApiResponse<LibraryMember>>(`/library-members/${id}`);
    return response.data;
  },

  createMember: async (data: Partial<LibraryMember>): Promise<ApiResponse<LibraryMember>> => {
    const response = await api.post<ApiResponse<LibraryMember>>('/library-members', data);
    return response.data;
  },

  blockMember: async (memberId: number, reason: string): Promise<ApiResponse<LibraryMember>> => {
    const response = await api.patch<ApiResponse<LibraryMember>>(`/library-members/${memberId}/block`, { reason });
    return response.data;
  },

  unblockMember: async (memberId: number): Promise<ApiResponse<LibraryMember>> => {
    const response = await api.patch<ApiResponse<LibraryMember>>(`/library-members/${memberId}/unblock`);
    return response.data;
  },

  // E-Resources
  getEResources: async (filters?: QueryFilters): Promise<PaginatedResponse<EResource>> => {
    const response = await api.get<PaginatedResponse<EResource>>('/e-resources', { params: filters });
    return response.data;
  },

  createEResource: async (data: Partial<EResource>): Promise<ApiResponse<EResource>> => {
    const response = await api.post<ApiResponse<EResource>>('/e-resources', data);
    return response.data;
  },

  updateEResource: async (id: number, data: Partial<EResource>): Promise<ApiResponse<EResource>> => {
    const response = await api.put<ApiResponse<EResource>>(`/e-resources/${id}`, data);
    return response.data;
  },

  deleteEResource: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/e-resources/${id}`);
    return response.data;
  },

  // Dashboard
  getDashboard: async (): Promise<ApiResponse<Record<string, unknown>>> => {
    const response = await api.get<ApiResponse<Record<string, unknown>>>(`/library/dashboard`);
    return response.data;
  },

  getOverdueBooks: async (): Promise<ApiResponse<BookBorrowing[]>> => {
    const response = await api.get<ApiResponse<BookBorrowing[]>>(`/borrowings/overdue`);
    return response.data;
  },
};

export default libraryService;
