import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard, Users, BookOpen, GraduationCap,
  CreditCard, FileText, Bell, LogOut, Menu, X,
  Building2, ClipboardList, BarChart3, ChevronRight,
  Clock, Calendar, User, CalendarDays,
} from "lucide-react";
import clsx from "clsx";

// Role ID to name mapping (matching database seed order)
// 1=university_admin, 2=finance_controller, 3=registrar, 4=college_admin, 5=hod, 6=faculty, 7=student, 8=staff
const roleIdToName: Record<number, string> = {
  1: "university_admin",
  2: "finance_controller",
  3: "registrar",
  4: "college_admin",
  5: "hod",
  6: "faculty",
  7: "student",
  8: "staff",
};

const roleMenus: Record<string, { label: string; icon: any; path: string }[]> = {
  university_admin: [
    { label: "Dashboard",    icon: LayoutDashboard, path: "/admin/dashboard"  },
    { label: "Colleges",     icon: Building2,       path: "/admin/colleges"   },
    { label: "Courses",      icon: BookOpen,        path: "/admin/courses"    },
    { label: "Users",        icon: Users,           path: "/admin/users"      },
    { label: "Admissions",   icon: CalendarDays,    path: "/admin/admissions" },
    { label: "Applications", icon: ClipboardList,   path: "/admin/applications"},
    { label: "Payments",     icon: CreditCard,      path: "/admin/payments"   },
  ],
  finance_controller: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/finance/dashboard" },
    { label: "Fee Structures", icon: BarChart3,   path: "/finance/fees"     },
    { label: "Payments",   icon: CreditCard,      path: "/finance/payments" },
  ],
  registrar: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/registrar/dashboard" },
    { label: "Exams",     icon: FileText,         path: "/registrar/exams"    },
    { label: "Results",   icon: BarChart3,        path: "/registrar/results"  },
  ],
  college_admin: [
    { label: "Dashboard",    icon: LayoutDashboard, path: "/college/dashboard"    },
    { label: "Students",     icon: GraduationCap,   path: "/college/students"     },
    { label: "Applications", icon: ClipboardList,   path: "/college/applications" },
    { label: "Courses",      icon: BookOpen,        path: "/college/courses"      },
    { label: "Fee Structures", icon: CreditCard,    path: "/college/fees"         },
    { label: "Faculty",      icon: Users,           path: "/college/faculty"      },
    { label: "Timetable",    icon: Clock,           path: "/college/timetable"    },
  ],
  hod: [
    { label: "Dashboard",    icon: LayoutDashboard, path: "/college/dashboard"    },
    { label: "Students",     icon: GraduationCap,   path: "/college/students"     },
    { label: "Applications", icon: ClipboardList,   path: "/college/applications" },
    { label: "Courses",      icon: BookOpen,        path: "/college/courses"      },
    { label: "Faculty",      icon: Users,           path: "/college/faculty"      },
    { label: "Timetable",    icon: Clock,           path: "/college/timetable"    },
  ],
  faculty: [
    { label: "Dashboard",    icon: LayoutDashboard, path: "/faculty/dashboard"  },
    { label: "Timetable",    icon: Clock,           path: "/faculty/timetable"  },
    { label: "Attendance",   icon: ClipboardList,   path: "/faculty/attendance" },
  ],
  staff: [
    { label: "Dashboard",    icon: LayoutDashboard, path: "/faculty/dashboard"  },
    { label: "Timetable",    icon: Clock,           path: "/faculty/timetable"  },
    { label: "Attendance",   icon: ClipboardList,   path: "/faculty/attendance" },
  ],
  student: [
    { label: "Dashboard",    icon: LayoutDashboard, path: "/student/dashboard"    },
    { label: "Profile",      icon: User,            path: "/student/profile"      },
    { label: "Applications", icon: FileText,        path: "/student/applications" },
    { label: "Payments",     icon: CreditCard,      path: "/student/payments"     },
    { label: "Results",      icon: BarChart3,       path: "/student/results"      },
    { label: "Documents",    icon: FileText,        path: "/student/documents"    },
    { label: "Timetable",    icon: Clock,           path: "/student/timetable"    },
    { label: "Attendance",   icon: ClipboardList,   path: "/student/attendance"   },
    { label: "Library",      icon: BookOpen,        path: "/student/library"      },
    { label: "Events",       icon: Calendar,        path: "/student/events"     },
  ],
};

const roleLabels: Record<string, string> = {
  university_admin:   "University Admin",
  finance_controller: "Finance Controller",
  registrar:          "Registrar",
  college_admin:      "College Admin",
  hod:                "HOD Dashboard",
  faculty:            "Faculty Portal",
  staff:              "Staff Portal",
  student:            "Student Portal",
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const userRoleName = user ? roleIdToName[user.role_id] || "student" : "student";
  const menu = roleMenus[userRoleName] || [];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-primary-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center
                          justify-center overflow-hidden">
            <img src="/Logo.png" alt="S University" className="w-8 h-8 object-contain" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">S University</p>
            <p className="text-primary-200 text-xs">
              {roleLabels[userRoleName]}
            </p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-primary-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-500 rounded-full flex items-center
                          justify-center text-white font-bold text-sm">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-white text-sm font-medium truncate">
              {user?.username}
            </p>
            <p className="text-primary-200 text-xs truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menu.map((item) => {
          const Icon    = item.icon;
          const active  = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setOpen(false)}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg",
                "transition-all duration-200 group",
                active
                  ? "bg-white text-primary-700 font-semibold shadow-sm"
                  : "text-primary-100 hover:bg-primary-700 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm flex-1">{item.label}</span>
              {active && <ChevronRight className="w-3 h-3" />}
            </Link>
          );
        })}
      </nav>

      {/* Notifications & Logout */}
      <div className="p-4 border-t border-primary-700 space-y-1">
        <Link
          to="/notifications"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg
                     text-primary-100 hover:bg-primary-700 hover:text-white
                     transition-all duration-200"
        >
          <Bell className="w-4 h-4" />
          <span className="text-sm">Notifications</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                     text-primary-100 hover:bg-red-600 hover:text-white
                     transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-primary-600
                   text-white rounded-lg shadow-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div className={clsx(
        "lg:hidden fixed inset-y-0 left-0 z-50 w-64",
        "bg-gradient-to-b from-primary-900 to-primary-800",
        "transform transition-transform duration-300",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 text-white"
        >
          <X className="w-5 h-5" />
        </button>
        <SidebarContent />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0
                      bg-gradient-to-b from-primary-900 to-primary-800
                      shadow-xl z-30">
        <SidebarContent />
      </div>
    </>
  );
}