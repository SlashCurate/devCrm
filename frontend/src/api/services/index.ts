// ==================== API SERVICES INDEX ====================
// Centralized export of all API services

// Auth & Users
export { authService, userService, default as authServices } from './authService';

// Core (University, College, Department, Program)
export { 
  universityService,
  collegeService,
  departmentService,
  programService,
  subjectService,
  academicYearService,
  semesterService,
  noticeService,
  eventService,
  holidayService,
  default as coreServices 
} from './coreService';

// Academic (Exams, Results, Attendance)
export { default as academicService } from './academicService';

// Students
export { default as studentService } from './studentService';

// Faculty
export { default as facultyService } from './facultyService';

// Finance
export { default as financeService } from './financeService';

// Library
export { default as libraryService } from './libraryService';

// Hostel
export { default as hostelService } from './hostelService';

// Notifications
export { notificationService, announcementService, default as notificationServices } from './notificationService';

// Re-export axios instance for custom requests
export { default as apiClient } from '../axios';
