// ==================== FINANCE TYPES (finance schema) ====================

import type { Student } from './student';
import type { Program } from './core';

// Fee Category
export interface FeeCategory {
  id: number;
  name: string;
  code: string;
  description?: string;
  is_recurring: boolean;
  is_refundable: boolean;
  priority: number;
  is_active: boolean;
}

// Fee Structure
export interface FeeStructure {
  id: number;
  program_id: number;
  program?: Program;
  academic_year_id: number;
  academic_year?: AcademicYear;
  semester_number: number;
  category_id: number;
  category?: FeeCategory;
  amount: number;
  due_date?: string;
  late_fine_per_day: number;
  is_active: boolean;
  created_by: number;
  created_at?: string;
  updated_at?: string;
}

interface AcademicYear {
  id: number;
  name: string;
}

// Student Fee Invoice (Individual student fee bill)
export interface StudentFeeInvoice {
  id: number;
  student_id: number;
  student?: Student;
  academic_year_id: number;
  semester_id?: number;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  
  // Fee Breakdown
  tuition_fee: number;
  exam_fee: number;
  library_fee: number;
  lab_fee: number;
  sports_fee: number;
  cultural_fee: number;
  development_fee: number;
  other_charges: number;
  
  // Calculations
  total_amount: number;
  discount_amount: number;
  discount_reason?: string;
  scholarship_amount: number;
  net_amount: number;
  
  // Status
  status: 'Pending' | 'Partial' | 'Paid' | 'Overdue' | 'Waived';
  paid_amount: number;
  balance_amount: number;
  
  created_at?: string;
  updated_at?: string;
  
  // Relations
  payments?: Payment[];
  items?: FeeInvoiceItem[];
}

export interface FeeInvoiceItem {
  id: number;
  invoice_id: number;
  fee_structure_id: number;
  fee_structure?: FeeStructure;
  amount: number;
  description?: string;
}

// Payment
export type PaymentStatus = 'Pending' | 'Success' | 'Failed' | 'Refunded' | 'Cancelled';
export type PaymentMethod = 'Online' | 'Cash' | 'Cheque' | 'DD' | 'BankTransfer' | 'Card';
export type PaymentGateway = 'Razorpay' | 'Stripe' | 'Paytm' | 'UPI' | 'Other';

export interface Payment {
  id: number;
  student_id: number;
  student?: Student;
  invoice_id: number;
  invoice?: StudentFeeInvoice;
  
  // Transaction Details
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  
  // Amount Details
  amount_paid: number;
  currency: string;
  
  // Status
  status: PaymentStatus;
  
  // Payment Method
  payment_mode: PaymentMethod;
  gateway?: PaymentGateway;
  
  // Timestamps
  payment_date: string;
  paid_at?: string;
  
  // Receipt
  receipt_number?: string;
  
  // Metadata
  notes?: string;
  failure_reason?: string;
  
  created_at?: string;
  updated_at?: string;
}

// Scholarship
export interface Scholarship {
  id: number;
  name: string;
  code?: string;
  type: 'Merit' | 'Need' | 'Sports' | 'Cultural' | 'Research' | 'Other';
  description?: string;
  eligibility_criteria?: string;
  amount_type: 'Fixed' | 'Percentage' | 'Full';
  amount?: number;
  percentage?: number;
  is_active: boolean;
}

export interface ScholarshipApplication {
  id: number;
  scholarship_id: number;
  scholarship?: Scholarship;
  student_id: number;
  student?: Student;
  academic_year_id: number;
  
  // Application Details
  income_certificate_url?: string;
  marksheet_url?: string;
  recommendation_letter_url?: string;
  other_documents?: string[];
  personal_statement?: string;
  
  // Financial Info
  annual_family_income?: number;
  
  // Status
  status: 'Applied' | 'UnderReview' | 'Shortlisted' | 'Approved' | 'Rejected';
  applied_date: string;
  approved_amount?: number;
  approved_by?: number;
  approved_at?: string;
  remarks?: string;
}

// Fee Concession/Waiver
export interface FeeConcession {
  id: number;
  student_id: number;
  student?: Student;
  invoice_id?: number;
  invoice?: StudentFeeInvoice;
  
  concession_type: 'StaffWard' | 'Sibling' | 'Merit' | 'Sports' | 'Disability' | 'Economic' | 'Other';
  percentage: number;
  amount: number;
  reason: string;
  
  approved_by: number;
  approved_at: string;
  valid_until?: string;
  is_active: boolean;
}

// Fine/Penalty
export interface StudentFine {
  id: number;
  student_id: number;
  student?: Student;
  fine_type: 'LateFee' | 'Library' | 'Discipline' | 'Damage' | 'Exam' | 'Other';
  description: string;
  amount: number;
  due_date?: string;
  status: 'Pending' | 'Paid' | 'Waived';
  paid_date?: string;
  waived_by?: number;
  waived_at?: string;
  waiver_reason?: string;
}

// Financial Reports
export interface DailyCollectionReport {
  date: string;
  total_collections: number;
  cash_collections: number;
  online_collections: number;
  cheque_collections: number;
  transaction_count: number;
}

export interface FeeOutstandingReport {
  program_id: number;
  program_name: string;
  total_students: number;
  total_fee_demand: number;
  total_fee_collected: number;
  total_outstanding: number;
  outstanding_percentage: number;
}
