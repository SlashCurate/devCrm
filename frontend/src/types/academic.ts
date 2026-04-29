// ==================== ACADEMIC TYPES (academic schema) ====================

import type { User } from './auth';
import type { Program, Subject, Semester } from './core';
import type { Student } from './student';
import type { Faculty } from './faculty';

// Assignment
export interface Assignment {
  id: number;
  subject_id: number;
  subject?: Subject;
  faculty_id: number;
  faculty?: Faculty;
  semester_id: number;
  semester?: Semester;
  title: string;
  description?: string;
  instructions?: string;
  total_marks: number;
  weightage_percent?: number;
  due_date?: string;
  allow_late_submission: boolean;
  late_submission_penalty?: number;
  attachments?: string[];
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AssignmentSubmission {
  id: number;
  assignment_id: number;
  assignment?: Assignment;
  student_id: number;
  student?: Student;
  submission_date?: string;
  content?: string;
  attachments?: string[];
  marks_obtained?: number;
  grade?: string;
  remarks?: string;
  status: 'Draft' | 'Submitted' | 'Graded' | 'Late';
  is_late: boolean;
  evaluated_by?: number;
  evaluated_at?: string;
  plagiarism_score?: number;
  created_at?: string;
  updated_at?: string;
}

// Exam Types
export type ExamType = 'Internal-1' | 'Internal-2' | 'Midterm' | 'Final' | 'Practical' | 'Viva' | 'Quiz' | 'Assignment';

export interface Exam {
  id: number;
  name: string;
  subject_id?: number;
  subject?: Subject;
  program_id?: number;
  program?: Program;
  college_id?: number;
  semester_id: number;
  semester?: Semester;
  exam_type: ExamType;
  exam_date?: string;
  start_time?: string;
  end_time?: string;
  duration?: number; // in minutes
  max_marks: number;
  pass_marks: number;
  weightage_percent?: number;
  venue?: string;
  description?: string;
  instructions?: string;
  is_published: boolean;
  published_by?: number;
  published_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ExamSchedule {
  id: number;
  exam_id: number;
  exam?: Exam;
  subject_id: number;
  subject?: Subject;
  exam_date: string;
  start_time: string;
  end_time: string;
  venue: string;
  max_students?: number;
  invigilator_id?: number;
  invigilator?: Faculty;
  is_active: boolean;
}

// Result
export interface Result {
  id: number;
  exam_id: number;
  exam?: Exam;
  student_id: number;
  student?: Student;
  subject_id?: number;
  subject?: Subject;
  marks_obtained: number;
  grade?: string;
  grade_points?: number;
  credit_points?: number;
  remarks?: string;
  is_absent: boolean;
  is_published: boolean;
  published_at?: string;
  published_by?: number;
  entered_by?: number;
  entered_at?: string;
  verified_by?: number;
  verified_at?: string;
  created_at?: string;
  updated_at?: string;
}

// Grade Scale
export interface GradeScale {
  id: number;
  grade: string;
  min_percentage: number;
  max_percentage: number;
  grade_points: number;
  description?: string;
  is_passing: boolean;
}

// Academic Progress
export interface AcademicProgress {
  id: number;
  student_id: number;
  student?: Student;
  program_id: number;
  program?: Program;
  semester_id: number;
  semester?: Semester;
  sgpa?: number;
  cgpa?: number;
  total_credits_earned: number;
  total_credits_attempted: number;
  status: 'Active' | 'Completed' | 'Discontinued' | 'Terminated';
  remarks?: string;
  promoted_to_next_semester: boolean;
}

// Attendance
export interface Attendance {
  id: number;
  student_id: number;
  student?: Student;
  subject_id?: number;
  subject?: Subject;
  semester_id?: number;
  semester?: Semester;
  faculty_id?: number;
  faculty?: Faculty;
  timetable_id?: number;
  attendance_date: string;
  status: 'Present' | 'Absent' | 'Late' | 'OnLeave' | 'Excused';
  remarks?: string;
  marked_by?: number;
  marked_at?: string;
  verified_by?: number;
  verified_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AttendanceSummary {
  student_id: number;
  student?: Student;
  subject_id?: number;
  subject?: Subject;
  semester_id: number;
  semester?: Semester;
  total_classes: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  leave_count: number;
  attendance_percentage: number;
  is_eligible_for_exam: boolean;
  minimum_required_percentage: number;
}

// Timetable
export interface Timetable {
  id: number;
  program_id?: number;
  program?: Program;
  subject_id: number;
  subject?: Subject;
  faculty_id: number;
  faculty?: Faculty;
  semester_id: number;
  semester?: Semester;
  day_of_week: number; // 0 = Sunday, 1 = Monday, etc.
  start_time: string;
  end_time: string;
  room_number?: string;
  building?: string;
  is_lab: boolean;
  is_active: boolean;
  effective_from?: string;
  effective_until?: string;
}

// Internal Marks
export interface InternalMarks {
  id: number;
  student_id: number;
  student?: Student;
  subject_id: number;
  subject?: Subject;
  semester_id: number;
  semester?: Semester;
  faculty_id?: number;
  faculty?: Faculty;
  // Various components
  assignment_marks?: number;
  quiz_marks?: number;
  presentation_marks?: number;
  attendance_marks?: number;
  internal_1_marks?: number;
  internal_2_marks?: number;
  total_internal_marks: number;
  max_internal_marks: number;
  remarks?: string;
  is_published: boolean;
  published_at?: string;
}

// Backlog/Supplementary
export interface BacklogRegistration {
  id: number;
  student_id: number;
  student?: Student;
  subject_id: number;
  subject?: Subject;
  semester_id: number;
  semester?: Semester;
  exam_type: 'Regular' | 'Supplementary' | 'Improvement';
  registration_date: string;
  fee_paid: number;
  fee_status: 'Pending' | 'Paid';
  exam_date?: string;
  status: 'Registered' | 'AdmitCardIssued' | 'Appeared' | 'Passed' | 'Failed';
  result?: Result;
}
