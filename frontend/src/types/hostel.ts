// ==================== HOSTEL TYPES (hostel schema) ====================

import type { Student } from './student';
import type { College } from './core';

// Hostel
export interface Hostel {
  id: number;
  college_id: number;
  college?: College;
  
  hostel_name: string;
  hostel_code?: string;
  hostel_type: 'Boys' | 'Girls' | 'CoEd' | 'International' | 'Staff';
  
  address?: string;
  phone?: string;
  
  // Capacity
  total_rooms: number;
  total_capacity: number;
  occupied_capacity: number;
  available_capacity: number;
  
  // Staff
  warden_name?: string;
  warden_phone?: string;
  warden_email?: string;
  
  // Facilities
  has_mess: boolean;
  has_gym: boolean;
  has_common_room: boolean;
  has_wifi: boolean;
  has_laundry: boolean;
  
  // Status
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Hostel Room
export interface HostelRoom {
  id: number;
  hostel_id: number;
  hostel?: Hostel;
  
  room_number: string;
  floor: number;
  
  room_type: 'Single' | 'Double' | 'Triple' | 'Four' | 'Dormitory';
  capacity: number;
  occupied: number;
  available: number;
  
  // Facilities
  has_bathroom: boolean;
  has_ac: boolean;
  has_fan: boolean;
  has_balcony: boolean;
  has_furniture: boolean;
  
  // Pricing
  fee_per_month: number;
  fee_per_semester?: number;
  fee_per_year?: number;
  
  // Status
  status: 'Available' | 'Full' | 'Maintenance' | 'Reserved';
  is_active: boolean;
}

// Hostel Allocation
export interface HostelAllocation {
  id: number;
  student_id: number;
  student?: Student;
  hostel_id: number;
  hostel?: Hostel;
  room_id: number;
  room?: HostelRoom;
  
  bed_number?: number;
  
  allocation_date: string;
  valid_until?: string;
  
  // Status
  status: 'Active' | 'Vacated' | 'Transferred';
  
  vacated_date?: string;
  vacated_reason?: string;
}

// Hostel Fee
export interface HostelFee {
  id: number;
  hostel_id: number;
  hostel?: Hostel;
  room_type: string;
  
  fee_type: 'Monthly' | 'Semester' | 'Yearly';
  amount: number;
  
  mess_charge?: number;
  security_deposit?: number;
  
  academic_year: string;
  is_active: boolean;
}

// Hostel Attendance
export interface HostelAttendance {
  id: number;
  student_id: number;
  student?: Student;
  hostel_id: number;
  hostel?: Hostel;
  
  date: string;
  status: 'Present' | 'Absent' | 'Out' | 'Leave';
  
  in_time?: string;
  out_time?: string;
  
  remarks?: string;
  marked_by?: number;
}

// Hostel Visitor
export interface HostelVisitor {
  id: number;
  student_id: number;
  student?: Student;
  hostel_id: number;
  hostel?: Hostel;
  
  visitor_name: string;
  relation: string;
  phone?: string;
  
  visit_date: string;
  in_time: string;
  out_time?: string;
  
  purpose?: string;
  id_proof_type?: string;
  id_proof_number?: string;
  
  approved_by?: number;
}

// Hostel Leave
export interface HostelLeave {
  id: number;
  student_id: number;
  student?: Student;
  hostel_id: number;
  hostel?: Hostel;
  
  leave_type: 'Home' | 'Personal' | 'Official' | 'Medical';
  from_date: string;
  to_date: string;
  
  destination?: string;
  reason: string;
  
  contact_while_away?: string;
  
  status: 'Pending' | 'Approved' | 'Rejected';
  applied_date: string;
  
  approved_by?: number;
  approved_at?: string;
  remarks?: string;
}

// Hostel Complaint
export interface HostelComplaint {
  id: number;
  student_id: number;
  student?: Student;
  hostel_id: number;
  hostel?: Hostel;
  room_id?: number;
  room?: HostelRoom;
  
  category: 'Electrical' | 'Plumbing' | 'Carpentry' | 'Cleaning' | 'Food' | 'Security' | 'Other';
  title: string;
  description: string;
  
  status: 'Open' | 'InProgress' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  
  submitted_date: string;
  resolved_date?: string;
  resolved_by?: number;
  resolution?: string;
}

// Mess/Meal
export interface MessMenu {
  id: number;
  hostel_id: number;
  hostel?: Hostel;
  
  day_of_week: number; // 0 = Sunday
  meal_type: 'Breakfast' | 'Lunch' | 'Snacks' | 'Dinner';
  
  menu_items: string;
  special_items?: string;
  
  start_time?: string;
  end_time?: string;
}

export interface MessAttendance {
  id: number;
  student_id: number;
  student?: Student;
  hostel_id: number;
  hostel?: Hostel;
  
  date: string;
  meal_type: 'Breakfast' | 'Lunch' | 'Snacks' | 'Dinner';
  availed: boolean;
}
