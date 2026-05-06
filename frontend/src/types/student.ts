// ==================== STUDENT TYPES (student schema) ====================

import type { User } from './auth';
import type { College, Program } from './core';

// Student Profile
export interface Student {
  id: number;
  user_id: string; // UUID
  user?: User;
  program_id?: number;
  program?: Program;
  
  // Academic Info
  roll_number?: string;
  university_reg_no?: string;
  enrollment_number?: string;
  admission_year: number;
  current_semester: number;
  batch: string;
  section?: string;
  
  // Status
  is_active: boolean;
  is_lateral_entry: boolean;
  
  // Personal Info
  first_name: string;
  last_name: string;
  gender?: Gender;
  dob?: string;
  blood_group?: string;
  
  // Contact Info
  phone?: string;
  alternate_phone?: string;
  personal_email?: string;
  
  // Address
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  
  // Demographics
  nationality?: string;
  religion?: string;
  category?: string;
  sub_category?: string;
  
  // Documents
  aadhar_number?: string;
  pan_number?: string;
  passport_number?: string;
  
  // Education History
  previous_school?: string;
  previous_board?: string;
  previous_percentage?: number;
  previous_year_of_passing?: number;
  
  // Guardians
  father_name?: string;
  father_occupation?: string;
  father_phone?: string;
  mother_name?: string;
  mother_occupation?: string;
  mother_phone?: string;
  guardian_name?: string;
  guardian_relation?: string;
  guardian_phone?: string;
  guardian_email?: string;
  
  // Emergency Contact
  emergency_contact_name?: string;
  emergency_contact_relation?: string;
  emergency_contact_phone?: string;
  
  // Media
  photo_url?: string;
  signature_url?: string;
  
  created_at?: string;
  updated_at?: string;
}

export type StudentStatus = 
  | 'Applied' 
  | 'Shortlisted' 
  | 'Admitted' 
  | 'Enrolled' 
  | 'Active' 
  | 'OnLeave' 
  | 'Graduated' 
  | 'Terminated' 
  | 'Discontinued';

export type Gender = 'Male' | 'Female' | 'Other' | 'PreferNotToSay';

// Import DocumentType from core
import type { DocumentType } from './core';

// Student Document
export interface StudentDocument {
  id: number;
  student_id: number;
  student?: Student;
  document_type: string;
  document_type_info?: DocumentType;
  file_name: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  is_verified: boolean;
  verified_by?: number;
  verified_at?: string;
  remarks?: string;
  upload_date?: string;
}

// Application for Admission
export interface AdmissionApplication {
  id: number;
  student_id?: number;
  student?: Student;
  program_id: number;
  program?: Program;
  college_id?: number;
  college?: College;
  academic_year_id?: number;
  
  // Personal Details
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  dob?: string;
  gender?: Gender;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  
  // Academic Details
  previous_school?: string;
  previous_board?: string;
  previous_grade?: string;
  previous_percentage?: number;
  year_of_passing?: number;
  
  // Entrance Exam
  entrance_exam?: string;
  entrance_score?: number;
  merit_rank?: number;
  
  // Statement
  statement_of_purpose?: string;
  
  // Status & Dates
  status: ApplicationStatus;
  applied_date?: string;
  submitted_at?: string;
  reviewed_at?: string;
  reviewed_by?: number;
  shortlisted_at?: string;
  enrolled_at?: string;
  rejection_reason?: string;
  remarks?: string;
  
  // Relations
  documents?: ApplicationDocument[];
}

export type ApplicationStatus = 
  | 'draft'
  | 'submitted'
  | 'payment_pending'
  | 'payment_completed'
  | 'under_review'
  | 'shortlisted'
  | 'document_verification'
  | 'admission_fee_pending'
  | 'admission_fee_paid'
  | 'enrolled'
  | 'rejected'
  | 'waitlisted'
  | 'cancelled';

export interface ApplicationDocument {
  id: number;
  application_id: number;
  document_type: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  is_verified: boolean;
  verified_at?: string;
  remarks?: string;
}

// Admission Cycle - Controls when admissions are open
export interface AdmissionCycle {
  id: number;
  created_at?: string;
  updated_at?: string;
  academic_year_id: number;
  academic_year?: {
    id: number;
    year_label: string;
  };
  name: string;
  description?: string;
  application_start_date: string;
  application_end_date: string;
  is_active: boolean;
  is_published: boolean;
  program_id?: number;
  program?: {
    id: number;
    name: string;
    code: string;
  };
  college_id?: number;
  college?: {
    id: number;
    name: string;
    code: string;
  };
  application_fee: number;
  admission_fee: number;
  max_applications: number;
  total_applications?: number;
  created_by?: string;
  // Computed fields from backend
  status?: 'open' | 'upcoming' | 'closed';
  days_until_close?: number;
}

// Applicant (Pre-enrollment application)
export interface Applicant {
  id: number;
  application_id: string;
  admission_cycle_id?: number;
  admission_cycle?: AdmissionCycle;
  program_id: number;
  program?: {
    id: number;
    name: string;
    code: string;
  };
  college_id: number;
  college?: {
    id: number;
    name: string;
    code: string;
  };
  academic_year_id: number;
  
  // Personal Info
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  dob?: string;
  gender?: string;
  category?: string;
  state?: string;
  city?: string;
  address?: string;
  pincode?: string;
  
  // Academic Info
  previous_school?: string;
  previous_grade?: string;
  previous_percentage?: number;
  year_of_passing?: number;
  entrance_exam?: string;
  entrance_score?: number;
  merit_rank?: number;
  
  // Statement
  statement?: string;
  
  // Status
  status: ApplicationStatus;
  rejection_reason?: string;
  remarks?: string;
  
  // Payment
  application_fee: number;
  application_fee_paid: boolean;
  application_fee_payment_id?: string;
  admission_fee: number;
  admission_fee_paid: boolean;
  admission_fee_payment_id?: string;
  
  // Documents
  documents_uploaded: boolean;
  documents_verified: boolean;
  
  // Draft
  draft_data?: string;
  draft_saved_at?: string;
  
  // Timestamps
  submitted_at?: string;
  payment_completed_at?: string;
  reviewed_at?: string;
  shortlisted_at?: string;
  documents_verified_at?: string;
  admission_fee_paid_at?: string;
  enrolled_at?: string;
  
  // Student link
  student_id?: number;
  student?: Student;
}

// Certificate/Document Request
export interface CertificateRequest {
  id: number;
  student_id: number;
  student?: Student;
  certificate_type: CertificateType;
  purpose?: string;
  copies_requested: number;
  fee_paid: number;
  status: 'Pending' | 'Processing' | 'Ready' | 'Issued' | 'Rejected';
  requested_date: string;
  expected_date?: string;
  issued_date?: string;
  issued_by?: number;
  remarks?: string;
}

export type CertificateType = 
  | 'Bonafide' 
  | 'Migration' 
  | 'Transcript' 
  | 'DegreeCertificate' 
  | 'Provisional' 
  | 'Character' 
  | 'Conduct' 
  | 'Rank';

// Student Leave
export interface StudentLeave {
  id: number;
  student_id: number;
  student?: Student;
  leave_type: 'Sick' | 'Personal' | 'Family' | 'Academic' | 'Sports' | 'Other';
  from_date: string;
  to_date: string;
  days: number;
  reason: string;
  attachment_url?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  applied_date: string;
  approved_by?: number;
  approved_at?: string;
  remarks?: string;
}

// Grievance/Complaint
export interface Grievance {
  id: number;
  student_id: number;
  student?: Student;
  category: 'Academic' | 'Administrative' | 'Infrastructure' | 'Faculty' | 'Exam' | 'Fee' | 'Other';
  subject: string;
  description: string;
  attachment_url?: string;
  status: 'Open' | 'InProgress' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  submitted_date: string;
  resolved_date?: string;
  resolved_by?: number;
  resolution?: string;
  satisfaction_rating?: number;
}
