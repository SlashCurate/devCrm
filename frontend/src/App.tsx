import React from "react";
import {
  BrowserRouter, Routes, Route, Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Auth Pages
import Login          from "./pages/auth/Login";
import Register       from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword  from "./pages/auth/ResetPassword";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers     from "./pages/admin/Users";
import AdminColleges  from "./pages/admin/Colleges";
import AdminCourses   from "./pages/admin/Courses";
import AdmissionCycles from "./pages/admin/AdmissionCycles";

// Finance Pages
import FinanceDashboard from "./pages/finance/Dashboard";
import FeeStructures    from "./pages/finance/FeeStructures";
import FinancePayments  from "./pages/finance/Payments";

// Registrar Pages
import RegistrarDashboard from "./pages/registrar/Dashboard";
import Exams              from "./pages/registrar/Exams";
import Results            from "./pages/registrar/Results";

// College Pages
import CollegeDashboard   from "./pages/college/Dashboard";
import CollegeStudents    from "./pages/college/Students";
import CollegeApplications from "./pages/college/Applications";
import CollegeCourses     from "./pages/college/Courses";
import CollegeFees        from "./pages/college/Fees";
import CollegeFaculty     from "./pages/college/Faculty";
import CollegeTimetable   from "./pages/college/Timetable";
import CollegeSubjects    from "./pages/college/Subjects";
import CollegeAttendance  from "./pages/college/Attendance";
import CollegeLibrary     from "./pages/college/Library";
import CollegeEvents      from "./pages/college/Events";

// Faculty Pages
import FacultyDashboard  from "./pages/faculty/Dashboard";
import FacultyTimetable  from "./pages/faculty/Timetable";
import FacultyAttendance from "./pages/faculty/Attendance";

// Student Pages
import StudentDashboard  from "./pages/student/Dashboard";
import Apply             from "./pages/student/Apply";
import MyApplications    from "./pages/student/Applications";
import StudentPayments   from "./pages/student/Payments";
import StudentResults    from "./pages/student/Results";
import StudentDocuments  from "./pages/student/Documents";
import StudentTimetable  from "./pages/student/Timetable";
import StudentAttendance from "./pages/student/Attendance";
import StudentLibrary    from "./pages/student/Library";
import StudentEvents     from "./pages/student/Events";
import StudentProfile    from "./pages/student/Profile";
import ApplicationStatus from "./pages/student/ApplicationStatus";

// Applicant Pages (Pre-enrollment)
import ApplicantDashboard from "./pages/applicant/Dashboard";

// Shared
import Notifications from "./pages/Notifications";

// ── Protected Route ──
function ProtectedRoute({
  children, roleIds,
}: {
  children: React.ReactElement;
  roleIds?: number[];
}) {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roleIds && user && !roleIds.includes(user.role_id))
    return <Navigate to="/login" replace />;
  return children;
}

// ── Finance Payments Page (reuse) ──
function FinancePaymentsPage() {
  return <FinancePayments />;
}

function AppRoutes() {
  const { user } = useAuth();

  // Role IDs: 1=university_admin, 2=finance_controller, 3=registrar, 4=college_admin, 5=hod, 6=faculty, 7=student, 8=staff
  const adminRoles     = [1]; // university_admin only
  const financeRoles   = [1, 2]; // university_admin, finance_controller
  const registrarRoles = [1, 3]; // university_admin, registrar
  const collegeRoles   = [1, 4, 5]; // university_admin, college_admin, hod
  const facultyRoles   = [1, 6, 8]; // university_admin, faculty, staff
  const studentRoles   = [7]; // student only

  return (
    <Routes>
      {/* Public */}
      <Route path="/login"           element={<Login />} />
      <Route path="/register"        element={<Register />} />
      
      {/* Public - Application Form (checks sessionStorage for applicant info) */}
      <Route path="/apply" element={<Apply />} />
      <Route path="/application-status" element={<ApplicationStatus />} />
      <Route path="/auth/application-status" element={<ApplicationStatus />} />
      <Route path="/applicant/dashboard" element={<ApplicantDashboard />} />
      <Route path="/forgot-password"    element={<ForgotPassword />} />
      <Route path="/reset-password"  element={<ResetPassword />} />

      {/* Root redirect */}
      <Route path="/" element={
        user ? (
          <Navigate to={
            user.role_id === 1                ? "/admin/dashboard"      :  // university_admin
            user.role_id === 2                ? "/finance/dashboard"    :  // finance_controller
            user.role_id === 3                ? "/registrar/dashboard"  :  // registrar
            user.role_id === 4                ? "/college/dashboard"    :  // college_admin
            user.role_id === 5                ? "/college/dashboard"    :  // hod -> college dashboard
            user.role_id === 6                ? "/faculty/dashboard"    :  // faculty
            user.role_id === 8                ? "/faculty/dashboard"    :  // staff -> faculty dashboard
                                                "/student/dashboard"       // student (7)
          } replace />
        ) : <Navigate to="/login" replace />
      } />

      {/* University Admin */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute roleIds={adminRoles}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <ProtectedRoute roleIds={adminRoles}>
          <AdminUsers />
        </ProtectedRoute>
      } />
      <Route path="/admin/colleges" element={
        <ProtectedRoute roleIds={adminRoles}>
          <AdminColleges />
        </ProtectedRoute>
      } />
      <Route path="/admin/courses" element={
        <ProtectedRoute roleIds={adminRoles}>
          <AdminCourses />
        </ProtectedRoute>
      } />
      <Route path="/admin/applications" element={
        <ProtectedRoute roleIds={adminRoles}>
          <CollegeApplications />
        </ProtectedRoute>
      } />
      <Route path="/admin/admission-cycles" element={
        <ProtectedRoute roleIds={adminRoles}>
          <AdmissionCycles />
        </ProtectedRoute>
      } />
      <Route path="/admin/admissions" element={
        <ProtectedRoute roleIds={adminRoles}>
          <AdmissionCycles />
        </ProtectedRoute>
      } />
      <Route path="/admin/payments" element={
        <ProtectedRoute roleIds={adminRoles}>
          <FinancePaymentsPage />
        </ProtectedRoute>
      } />

      {/* Finance */}
      <Route path="/finance/dashboard" element={
        <ProtectedRoute roleIds={financeRoles}>
          <FinanceDashboard />
        </ProtectedRoute>
      } />
      <Route path="/finance/fees" element={
        <ProtectedRoute roleIds={financeRoles}>
          <FeeStructures />
        </ProtectedRoute>
      } />
      <Route path="/finance/payments" element={
        <ProtectedRoute roleIds={financeRoles}>
          <FinancePaymentsPage />
        </ProtectedRoute>
      } />

      {/* Registrar */}
      <Route path="/registrar/dashboard" element={
        <ProtectedRoute roleIds={registrarRoles}>
          <RegistrarDashboard />
        </ProtectedRoute>
      } />
      <Route path="/registrar/exams" element={
        <ProtectedRoute roleIds={registrarRoles}>
          <Exams />
        </ProtectedRoute>
      } />
      <Route path="/registrar/results" element={
        <ProtectedRoute roleIds={registrarRoles}>
          <Results />
        </ProtectedRoute>
      } />

      {/* College Admin */}
      <Route path="/college/dashboard" element={
        <ProtectedRoute roleIds={collegeRoles}>
          <CollegeDashboard />
        </ProtectedRoute>
      } />
      <Route path="/college/students" element={
        <ProtectedRoute roleIds={collegeRoles}>
          <CollegeStudents />
        </ProtectedRoute>
      } />
      <Route path="/college/applications" element={
        <ProtectedRoute roleIds={collegeRoles}>
          <CollegeApplications />
        </ProtectedRoute>
      } />
      <Route path="/college/courses" element={
        <ProtectedRoute roleIds={collegeRoles}>
          <CollegeCourses />
        </ProtectedRoute>
      } />
      <Route path="/college/fees" element={
        <ProtectedRoute roleIds={collegeRoles}>
          <CollegeFees />
        </ProtectedRoute>
      } />
      <Route path="/college/faculty" element={
        <ProtectedRoute roleIds={collegeRoles}>
          <CollegeFaculty />
        </ProtectedRoute>
      } />
      <Route path="/college/timetable" element={
        <ProtectedRoute roleIds={collegeRoles}>
          <CollegeTimetable />
        </ProtectedRoute>
      } />
      <Route path="/college/subjects" element={
        <ProtectedRoute roleIds={collegeRoles}>
          <CollegeSubjects />
        </ProtectedRoute>
      } />
      <Route path="/college/attendance" element={
        <ProtectedRoute roleIds={collegeRoles}>
          <CollegeAttendance />
        </ProtectedRoute>
      } />
      <Route path="/college/library" element={
        <ProtectedRoute roleIds={collegeRoles}>
          <CollegeLibrary />
        </ProtectedRoute>
      } />
      <Route path="/college/events" element={
        <ProtectedRoute roleIds={collegeRoles}>
          <CollegeEvents />
        </ProtectedRoute>
      } />

      {/* Faculty */}
      <Route path="/faculty/dashboard" element={
        <ProtectedRoute roleIds={facultyRoles}>
          <FacultyDashboard />
        </ProtectedRoute>
      } />
      <Route path="/faculty/timetable" element={
        <ProtectedRoute roleIds={facultyRoles}>
          <FacultyTimetable />
        </ProtectedRoute>
      } />
      <Route path="/faculty/attendance" element={
        <ProtectedRoute roleIds={facultyRoles}>
          <FacultyAttendance />
        </ProtectedRoute>
      } />
      <Route path="/faculty/attendance/:timetableId" element={
        <ProtectedRoute roleIds={facultyRoles}>
          <FacultyAttendance />
        </ProtectedRoute>
      } />

      {/* Student */}
      <Route path="/student/dashboard" element={
        <ProtectedRoute roleIds={studentRoles}>
          <StudentDashboard />
        </ProtectedRoute>
      } />
      <Route path="/student/profile" element={
        <ProtectedRoute roleIds={studentRoles}>
          <StudentProfile />
        </ProtectedRoute>
      } />
      <Route path="/student/applications" element={
        <ProtectedRoute roleIds={studentRoles}>
          <MyApplications />
        </ProtectedRoute>
      } />
      <Route path="/student/payments" element={
        <ProtectedRoute roleIds={studentRoles}>
          <StudentPayments />
        </ProtectedRoute>
      } />
      <Route path="/student/results" element={
        <ProtectedRoute roleIds={studentRoles}>
          <StudentResults />
        </ProtectedRoute>
      } />
      <Route path="/student/documents" element={
        <ProtectedRoute roleIds={studentRoles}>
          <StudentDocuments />
        </ProtectedRoute>
      } />
      <Route path="/student/timetable" element={
        <ProtectedRoute roleIds={studentRoles}>
          <StudentTimetable />
        </ProtectedRoute>
      } />
      <Route path="/student/attendance" element={
        <ProtectedRoute roleIds={studentRoles}>
          <StudentAttendance />
        </ProtectedRoute>
      } />
      <Route path="/student/library" element={
        <ProtectedRoute roleIds={studentRoles}>
          <StudentLibrary />
        </ProtectedRoute>
      } />
      <Route path="/student/events" element={
        <ProtectedRoute roleIds={studentRoles}>
          <StudentEvents />
        </ProtectedRoute>
      } />

      {/* Shared */}
      <Route path="/notifications" element={
        <ProtectedRoute>
          <Notifications />
        </ProtectedRoute>
      } />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#650C08",
              color: "#fff1f2",
              borderRadius: "12px",
              fontSize: "14px",
            },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}