// ==================== LIBRARY TYPES (library schema) ====================

import type { Student } from './student';
import type { Faculty } from './faculty';
import type { Subject } from './core';

// Book
export interface Book {
  id: number;
  isbn?: string;
  title: string;
  author?: string;
  publisher?: string;
  edition?: string;
  year_published?: number;
  
  // Classification
  category?: string;
  subject_id?: number;
  subject?: Subject;
  
  // Location
  rack_number?: string;
  shelf_number?: string;
  
  // Inventory
  total_copies: number;
  available_copies: number;
  
  // Media
  cover_image_url?: string;
  description?: string;
  
  // Pricing (for lost book calculation)
  price?: number;
  
  // Status
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Book Borrowing
export interface BookBorrowing {
  id: number;
  book_id: number;
  book?: Book;
  
  // Borrower (can be student or faculty)
  student_id?: number;
  student?: Student;
  faculty_id?: number;
  faculty?: Faculty;
  
  // Issue Details
  issued_by: number;
  issue_date: string;
  due_date: string;
  
  // Return Details
  return_date?: string;
  returned_to?: number;
  
  // Fine
  fine_amount: number;
  fine_paid: number;
  fine_status: 'None' | 'Pending' | 'Paid' | 'Waived';
  
  // Status
  status: 'Issued' | 'Returned' | 'Overdue' | 'Lost';
  remarks?: string;
  
  created_at?: string;
  updated_at?: string;
}

// Library Member
export interface LibraryMember {
  id: number;
  user_type: 'Student' | 'Faculty' | 'Staff';
  student_id?: number;
  student?: Student;
  faculty_id?: number;
  faculty?: Faculty;
  
  member_code: string;
  join_date: string;
  
  // Limits
  max_books_allowed: number;
  current_books_issued: number;
  
  // Status
  is_active: boolean;
  is_blocked: boolean;
  block_reason?: string;
}

// Book Reservation
export interface BookReservation {
  id: number;
  book_id: number;
  book?: Book;
  student_id?: number;
  student?: Student;
  faculty_id?: number;
  faculty?: Faculty;
  
  reservation_date: string;
  expected_available_date?: string;
  expiry_date: string;
  
  status: 'Active' | 'Fulfilled' | 'Expired' | 'Cancelled';
  fulfillment_date?: string;
  
  queue_position?: number;
}

// E-Resource
export interface EResource {
  id: number;
  title: string;
  type: 'E-Book' | 'Journal' | 'Article' | 'Video' | 'Database' | 'Other';
  author?: string;
  publisher?: string;
  publication_year?: number;
  subject?: string;
  description?: string;
  access_url?: string;
  access_type: 'Open' | 'Subscription' | 'Institutional';
  is_active: boolean;
}

// Library Fine Configuration
export interface LibraryFineConfig {
  id: number;
  user_type: 'Student' | 'Faculty' | 'Staff';
  fine_per_day: number;
  max_fine_amount: number;
  grace_period_days: number;
  book_lost_penalty_percentage: number;
}

// Library Transaction
export type LibraryTransactionType = 'Issue' | 'Return' | 'Renew' | 'Fine' | 'Reservation';

export interface LibraryTransaction {
  id: number;
  transaction_type: LibraryTransactionType;
  book_id: number;
  book?: Book;
  borrowing_id?: number;
  borrowing?: BookBorrowing;
  
  user_type: 'Student' | 'Faculty' | 'Staff';
  student_id?: number;
  faculty_id?: number;
  
  processed_by: number;
  transaction_date: string;
  remarks?: string;
}

// Book Review/Rating
export interface BookReview {
  id: number;
  book_id: number;
  book?: Book;
  student_id?: number;
  student?: Student;
  faculty_id?: number;
  faculty?: Faculty;
  
  rating: number; // 1-5
  review?: string;
  review_date: string;
  is_approved: boolean;
}
