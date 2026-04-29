// ==================== FACULTY TYPES (faculty schema) ====================

import type { User } from './auth';
import type { College, Department, Subject } from './core';

// Faculty Profile
export interface Faculty {
  id: number;
  user_id: string; // UUID
  user?: User;
  department_id?: number;
  department?: Department;
  
  // Employment Details
  employee_code: string;
  designation: FacultyDesignation;
  employment_type: 'FullTime' | 'PartTime' | 'Contractual' | 'Visiting';
  
  // Personal Info
  first_name: string;
  last_name: string;
  gender?: 'Male' | 'Female' | 'Other';
  dob?: string;
  blood_group?: string;
  phone?: string;
  email?: string;
  emergency_contact?: string;
  
  // Address
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  
  // Professional Info
  qualification: string;
  specialization?: string;
  experience_years: number;
  experience_details?: string;
  
  // Employment Dates
  joining_date?: string;
  confirmation_date?: string;
  retirement_date?: string;
  leaving_date?: string;
  
  // Financial
  basic_salary: number;
  gross_salary?: number;
  bank_name?: string;
  bank_account?: string;
  ifsc_code?: string;
  pan_number?: string;
  
  // Documents
  resume_url?: string;
  photo_url?: string;
  
  // Status
  is_active: boolean;
  is_hod: boolean;
  
  // Relations
  subjects?: Subject[];
  created_at?: string;
  updated_at?: string;
}

export type FacultyDesignation = 
  | 'Professor' 
  | 'AssociateProfessor' 
  | 'AssistantProfessor' 
  | 'Lecturer' 
  | 'SeniorLecturer'
  | 'LabAssistant'
  | 'ResearchScholar'
  | 'VisitingFaculty';

// Faculty Leave
export interface FacultyLeave {
  id: number;
  faculty_id: number;
  faculty?: Faculty;
  leave_type: 'Casual' | 'Medical' | 'Earned' | 'Maternity' | 'Paternity' | 'Study' | 'Sabbatical' | 'Other';
  from_date: string;
  to_date: string;
  days: number;
  reason: string;
  is_half_day: boolean;
  half_day_type?: 'FirstHalf' | 'SecondHalf';
  attachment_url?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  applied_date: string;
  approved_by?: number;
  approved_at?: string;
  remarks?: string;
}

// Faculty Attendance
export interface FacultyAttendance {
  id: number;
  faculty_id: number;
  faculty?: Faculty;
  date: string;
  status: 'Present' | 'Absent' | 'OnLeave' | 'OnDuty' | 'HalfDay';
  in_time?: string;
  out_time?: string;
  hours_worked?: number;
  is_late: boolean;
  late_minutes?: number;
  is_early_exit: boolean;
  early_exit_minutes?: number;
  marked_by?: number;
  remarks?: string;
}

// Research & Publications
export interface ResearchPublication {
  id: number;
  faculty_id: number;
  faculty?: Faculty;
  title: string;
  type: 'Journal' | 'Conference' | 'Book' | 'BookChapter' | 'Patent' | 'Project';
  authors: string;
  journal_name?: string;
  publisher?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  publication_date?: string;
  impact_factor?: number;
  citations?: number;
  url?: string;
  is_peer_reviewed: boolean;
}

// Teaching Workload
export interface TeachingWorkload {
  id: number;
  faculty_id: number;
  faculty?: Faculty;
  semester_id: number;
  theory_hours_assigned: number;
  practical_hours_assigned: number;
  tutorial_hours_assigned: number;
  total_hours: number;
  max_hours_allowed: number;
  subjects_assigned: WorkloadSubject[];
}

export interface WorkloadSubject {
  subject_id: number;
  subject?: Subject;
  hours_per_week: number;
  type: 'Theory' | 'Practical' | 'Tutorial';
}
