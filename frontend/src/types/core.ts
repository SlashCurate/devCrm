// ==================== CORE TYPES (core schema) ====================

// University
export interface University {
  id: number;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  established_year?: number;
  accreditation?: string;
  logo_url?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// College
export interface College {
  id: number;
  university_id: number;
  university?: University;
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  website?: string;
  established_year?: number;
  principal_name?: string;
  principal_phone?: string;
  total_students?: number;
  total_faculty?: number;
  logo_url?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  about?: string;
  // Relations
  departments?: Department[];
  programs?: Program[];
}

// Department
export interface Department {
  id: number;
  college_id: number;
  college?: College;
  name: string;
  code: string;
  hod_id?: number;
  hod?: Faculty;
  phone?: string;
  email?: string;
  description?: string;
  established_year?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  // Relations
  programs?: Program[];
  faculty?: Faculty[];
}

// Program (formerly Course)
export interface Program {
  id: number;
  department_id: number;
  department?: Department;
  college_id?: number;
  college?: College;
  name: string;
  code: string;
  duration_years: number;
  total_semesters: number;
  degree_type: 'Bachelor' | 'Master' | 'Doctorate' | 'Diploma' | 'Certificate';
  specialization?: string;
  total_seats: number;
  filled_seats: number;
  description?: string;
  eligibility_criteria?: string;
  career_opportunities?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  // Relations
  subjects?: Subject[];
  fee_structures?: FeeStructure[];
}

// Subject
export interface Subject {
  id: number;
  program_id?: number;
  program?: Program;
  department_id?: number;
  department?: Department;
  code: string;
  name: string;
  credits: number;
  theory_hours?: number;
  practical_hours?: number;
  total_hours?: number;
  semester?: number;
  description?: string;
  syllabus_outline?: string;
  is_elective: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Academic Year
export interface AcademicYear {
  id: number;
  name: string; // e.g., "2024-2025"
  start_date: string;
  end_date: string;
  is_current: boolean;
  registration_open: boolean;
  is_active: boolean;
}

// Semester
export interface Semester {
  id: number;
  academic_year_id: number;
  academic_year?: AcademicYear;
  program_id?: number;
  program?: Program;
  semester_number: number;
  start_date: string;
  end_date: string;
  exam_start_date?: string;
  exam_end_date?: string;
  result_date?: string;
  is_current: boolean;
  is_active: boolean;
}

// Notice/Event Types
export type NoticeType = 'Exam' | 'Event' | 'Holiday' | 'Fee' | 'General' | 'Urgent' | 'Academic' | 'Placement';
export type TargetAudience = 'All' | 'Students' | 'Faculty' | 'Staff' | 'Parents';

export interface Notice {
  id: number;
  college_id?: number;
  college?: College;
  department_id?: number;
  department?: Department;
  title: string;
  content: string;
  notice_type: NoticeType;
  target_audience: TargetAudience;
  attachment_url?: string;
  posted_by?: number;
  posted_by_user?: User;
  posted_date?: string;
  expiry_date?: string;
  is_pinned: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Event
export type EventType = 'Cultural' | 'Technical' | 'Sports' | 'Seminar' | 'Workshop' | 'Conference' | 'Fest';

export interface Event {
  id: number;
  college_id?: number;
  college?: College;
  event_name: string;
  event_type: EventType;
  description?: string;
  banner_url?: string;
  event_date?: string;
  end_date?: string;
  venue?: string;
  organizer?: string;
  registration_link?: string;
  max_participants?: number;
  registered_count?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Holiday
export interface Holiday {
  id: number;
  name: string;
  date: string;
  type: 'National' | 'Regional' | 'Institutional';
  description?: string;
  is_active: boolean;
}

// Document Types
export interface DocumentType {
  id: number;
  name: string;
  code: string;
  description?: string;
  is_mandatory: boolean;
  allowed_extensions: string[];
  max_size_mb: number;
  is_active: boolean;
}

// Placement Related
export interface Company {
  id: number;
  name: string;
  code?: string;
  industry?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  contact_person?: string;
  contact_designation?: string;
  description?: string;
  logo_url?: string;
  is_active: boolean;
}

export interface PlacementDrive {
  id: number;
  company_id: number;
  company?: Company;
  title: string;
  description?: string;
  job_roles?: string;
  job_location?: string;
  package_lpa?: number;
  drive_date?: string;
  application_deadline?: string;
  eligibility_criteria?: string;
  required_skills?: string;
  selection_process?: string;
  is_active: boolean;
}

export interface PlacementApplication {
  id: number;
  drive_id: number;
  drive?: PlacementDrive;
  student_id: number;
  student?: Student;
  status: 'Applied' | 'Shortlisted' | 'Interview' | 'Selected' | 'Rejected';
  applied_date?: string;
  remarks?: string;
}

// Import User type for relations
import type { User } from './auth';
import type { Faculty } from './faculty';
import type { Student } from './student';
import type { FeeStructure } from './finance';
