// ==================== HOOKS INDEX ====================
// Centralized export of all custom React hooks

// Auth & User Hooks
export * from './useAuth';

// Core Data Hooks (University, College, Department, Program, etc.)
export * from './useCore';

// Student Hooks (Students, Applications, Documents, Leaves)
export * from './useStudents';

// Academic Hooks (Exams, Results, Attendance, Timetables)
export * from './useAcademic';

// Faculty Hooks (Faculty, Leaves, Publications, Workload)
export * from './useFaculty';

// Finance Hooks (Fee Structures, Invoices, Payments, Scholarships)
export * from './useFinance';

// Library Hooks (Books, Borrowing, Reservations, E-Resources)
export * from './useLibrary';

// Hostel Hooks (Hostels, Rooms, Allocations, Mess)
export * from './useHostel';

// Notification Hooks (Notifications, Announcements, Preferences)
export * from './useNotifications';

// Re-export query client utilities
export { useQueryClient } from '@tanstack/react-query';
