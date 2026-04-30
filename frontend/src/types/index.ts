// ==================== UNIVERSITY ERP - MODULAR TYPES ====================
// Organized by backend schema for clear separation and maintainability

// Auth & Core
export * from './auth';
export * from './core';

// Domain Modules
export * from './academic';
export * from './student';
export * from './faculty';
export * from './finance';
export * from './library';
export * from './hostel';
export * from './notify';

// ==================== BACKWARD COMPATIBILITY ALIASES ====================
// These aliases ensure existing code continues to work during migration

import type { 
  Program, 
  College 
} from './core';

import type { 
  Student as StudentDomain, 
  AdmissionApplication,
  StudentDocument
} from './student';

/** @deprecated Use StudentDocument instead */
export type Document = StudentDocument;

import type { 
  StudentFeeInvoice, 
  Payment,
  FeeStructure
} from './finance';

import type { 
  ApiResponse, 
  PaginatedResponse 
} from './auth';

/** @deprecated Use Program instead */
export type Course = Program;

/** @deprecated Use Program instead */
export type CourseID = number;

/** @deprecated Use program_id instead of course_id */
export type CourseIdField = { program_id: number };

// Re-export Student with backward compatible fields
export interface Student extends StudentDomain {
  /** @deprecated Use university_reg_no instead */
  EnrollmentNumber?: string;
  /** @deprecated Use program_id instead */
  CourseID?: number;
  /** @deprecated Use program instead */
  Course?: Program;
  /** @deprecated Use first_name instead */
  FirstName: string;
  /** @deprecated Use last_name instead */
  LastName: string;
  /** @deprecated Use phone instead */
  Phone: string;
  /** @deprecated Use address instead */
  Address: string;
  /** @deprecated Use city instead */
  City: string;
  /** @deprecated Use state instead */
  State: string;
  /** @deprecated Use pincode instead */
  PinCode: string;
  /** @deprecated Use previous_school instead */
  PreviousSchool: string;
  /** @deprecated Use previous_grade instead */
  PreviousGrade: string;
}

/** @deprecated Use AdmissionApplication instead */
export type Application = AdmissionApplication;

export interface LegacyPayment {
  ID: number;
  StudentID: number;
  Student?: LegacyStudent;
  FeeStructureID: number;
  FeeStructure?: LegacyFeeStructure;
  RazorpayOrderID: string;
  RazorpayPaymentID?: string;
  Amount: number;
  Currency: string;
  Status: string;
  PaymentMethod?: string;
  PaidAt?: string;
  Receipt: string;
}

/** @deprecated Use ApiResponse or PaginatedResponse instead */
export type APIResponse<T> = ApiResponse<T>;

// ==================== LEGACY TYPE EXPORTS ====================
// For gradual migration - these match the old structure

export interface LegacyCollege {
  ID: number;
  Name: string;
  Code: string;
  Address: string;
  Phone: string;
  Email: string;
  IsActive: boolean;
  Courses?: Program[];
}

export interface LegacyCourse {
  ID: number;
  Name: string;
  Code: string;
  CollegeID: number;
  Duration: number;
  TotalSeats: number;
  FilledSeats: number;
  Description: string;
  IsActive: boolean;
  College?: LegacyCollege;
}

export interface LegacyStudent {
  ID: number;
  UserID: number;
  User?: User;
  CollegeID?: number;
  College?: LegacyCollege;
  CourseID?: number;
  Course?: LegacyCourse;
  EnrollmentNumber?: string;
  Status: string;
  FirstName: string;
  LastName: string;
  DOB?: string;
  Gender: string;
  Phone: string;
  Address: string;
  City: string;
  State: string;
  PinCode: string;
  PreviousSchool: string;
  PreviousGrade: string;
  FeePaid: boolean;
  ApplicationDate?: string;
  EnrollmentDate?: string;
}

export interface LegacyDocument {
  ID: number;
  StudentID: number;
  ApplicationID?: number;
  DocumentType: string;
  FileName: string;
  FileURL: string;
  IsVerified: boolean;
  VerifiedAt?: string;
  Remarks?: string;
}

export interface LegacyApplication {
  ID: number;
  StudentID: number;
  Student?: LegacyStudent;
  CourseID: number;
  Course?: LegacyCourse;
  CollegeID: number;
  College?: LegacyCollege;
  Status: string;
  FirstName: string;
  LastName: string;
  Email: string;
  Phone: string;
  Gender: string;
  Address: string;
  City: string;
  State: string;
  PinCode: string;
  PreviousSchool: string;
  PreviousGrade: string;
  Statement: string;
  RejectionReason?: string;
  SubmittedAt?: string;
  ShortlistedAt?: string;
  EnrolledAt?: string;
  Documents?: LegacyDocument[];
}

export interface LegacyFeeStructure {
  ID: number;
  CollegeID: number;
  College?: LegacyCollege;
  CourseID: number;
  Course?: LegacyCourse;
  Name: string;
  FeeType: string;
  Amount: number;
  DueDate?: string;
  AcademicYear: string;
  IsActive: boolean;
}

export interface LegacyPayment {
  ID: number;
  StudentID: number;
  Student?: LegacyStudent;
  FeeStructureID: number;
  FeeStructure?: LegacyFeeStructure;
  RazorpayOrderID: string;
  RazorpayPaymentID?: string;
  Amount: number;
  Currency: string;
  Status: string;
  PaymentMethod?: string;
  PaidAt?: string;
  Receipt: string;
}

export interface LegacyExam {
  ID: number;
  Name: string;
  CourseID: number;
  Course?: LegacyCourse;
  CollegeID: number;
  College?: LegacyCollege;
  ExamDate: string;
  Duration: number;
  TotalMarks: number;
  PassingMarks: number;
  AcademicYear: string;
  Semester: number;
  IsPublished: boolean;
  PublishedAt?: string;
  Description: string;
}

export interface LegacyResult {
  ID: number;
  ExamID: number;
  Exam?: LegacyExam;
  StudentID: number;
  Student?: LegacyStudent;
  SubjectID?: number;
  MarksObtained: number;
  Grade: string;
  Remarks: string;
  IsPublished: boolean;
  PublishedAt?: string;
}

export interface LegacyNotification {
  ID: number;
  UserID: number;
  Title: string;
  Message: string;
  IsRead: boolean;
  Type: string;
  CreatedAt: string;
}

export interface LegacyFaculty {
  ID: number;
  UserID: number;
  User?: User;
  CollegeID?: number;
  College?: LegacyCollege;
  EmployeeCode: string;
  FirstName: string;
  LastName: string;
  Department: string;
  Designation: string;
  Qualification: string;
  Experience: number;
  Specialization: string;
  Phone: string;
  JoiningDate?: string;
  IsActive: boolean;
  Salary: number;
}

export interface LegacySubject {
  ID: number;
  Name: string;
  Code: string;
  CourseID: number;
  Course?: LegacyCourse;
  Description: string;
  Credits: number;
  IsActive: boolean;
}

export interface LegacyTimetable {
  ID: number;
  CollegeID: number;
  College?: LegacyCollege;
  CourseID: number;
  Course?: LegacyCourse;
  SubjectID: number;
  Subject?: LegacySubject;
  FacultyID: number;
  Faculty?: LegacyFaculty;
  DayOfWeek: number;
  StartTime: string;
  EndTime: string;
  RoomNumber: string;
  Semester: number;
  AcademicYear: string;
  IsActive: boolean;
}

export interface LegacyAttendance {
  ID: number;
  StudentID: number;
  Student?: LegacyStudent;
  TimetableID: number;
  Timetable?: LegacyTimetable;
  FacultyID: number;
  Faculty?: LegacyFaculty;
  Date: string;
  Status: 'present' | 'absent' | 'late' | 'on_leave';
  Remarks: string;
  MarkedAt: string;
}

export interface LegacyBook {
  ID: number;
  ISBN: string;
  Title: string;
  Author: string;
  Publisher: string;
  Edition: string;
  Category: string;
  Subject: string;
  ShelfLocation: string;
  TotalCopies: number;
  AvailableCopies: number;
  Price: number;
  YearOfPublication: number;
  Description: string;
  IsActive: boolean;
}

export interface LegacyBookBorrowing {
  ID: number;
  BookID: number;
  Book?: LegacyBook;
  StudentID: number;
  Student?: LegacyStudent;
  IssuedBy: number;
  IssueDate: string;
  DueDate: string;
  ReturnDate?: string;
  FineAmount: number;
  IsReturned: boolean;
  Status: string;
  Remarks: string;
}

export interface LegacyEvent {
  ID: number;
  Title: string;
  Description: string;
  EventType: 'academic' | 'cultural' | 'sports' | 'holiday' | 'exam';
  StartDate: string;
  EndDate: string;
  Venue: string;
  Organizer: string;
  CollegeID?: number;
  College?: LegacyCollege;
  IsPublic: boolean;
  IsHoliday: boolean;
  CreatedBy: number;
  CreatedAt: string;
}

// Type guards for migration
export function isModernProgram(obj: unknown): obj is Program {
  return typeof obj === 'object' && obj !== null && 'department_id' in obj;
}

export function isLegacyCourse(obj: unknown): obj is LegacyCourse {
  return typeof obj === 'object' && obj !== null && 'CollegeID' in obj;
}

// Migration helpers
export function adaptCourseToProgram(course: LegacyCourse): Program {
  return {
    id: course.ID,
    department_id: course.CollegeID, // Temporary mapping
    name: course.Name,
    code: course.Code,
    duration_years: Math.ceil(course.Duration / 12),
    total_semesters: course.Duration * 2, // Assuming semester system
    degree_type: 'Bachelor',
    total_seats: course.TotalSeats,
    filled_seats: course.FilledSeats,
    description: course.Description,
    is_active: course.IsActive,
    college_id: course.CollegeID,
  };
}

export function adaptProgramToCourse(program: Program): LegacyCourse {
  return {
    ID: program.id,
    Name: program.name,
    Code: program.code,
    CollegeID: program.college_id || 0,
    Duration: program.total_semesters / 2,
    TotalSeats: program.total_seats,
    FilledSeats: program.filled_seats,
    Description: program.description || '',
    IsActive: program.is_active,
    College: undefined,
  };
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  role_name: string;
  phone: string;
  college_id?: number;
  is_active: boolean;
}