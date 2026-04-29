import React, { useEffect, useState } from "react";
import Layout from "../../components/shared/Layout";
import PageHeader from "../../components/shared/PageHeader";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import api from "../../api/axios";
import { Faculty, Timetable } from "../../types";
import { Calendar, Clock, Users, BookOpen, CheckCircle, GraduationCap } from "lucide-react";
import toast from "react-hot-toast";

interface DashboardData {
  faculty: Faculty;
  today_timetable: Timetable[];
  attendance_stats: {
    total_classes: number;
    marked_today: number;
    pending_classes: number;
  };
  subject_count: number;
}

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function FacultyDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get("/faculty/dashboard");
      console.log("Faculty dashboard response:", res.data);
      if (res.data?.data) {
        setData(res.data.data);
      } else {
        console.error("Invalid response structure:", res.data);
        toast.error("Invalid data received from server");
      }
    } catch (err: any) {
      console.error("Dashboard fetch error:", err);
      console.error("Error response:", err.response?.data);
      toast.error(err.response?.data?.error || "Failed to fetch dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;
  if (!data) return <Layout><p className="p-8 text-gray-500">No data available</p></Layout>;

  const { faculty, today_timetable, attendance_stats, subject_count } = data;
  const today = daysOfWeek[new Date().getDay()];

  return (
    <Layout>
      <PageHeader
        title={`Welcome, ${faculty.first_name || "Faculty"}! 👋`}
        subtitle="Your teaching portal overview"
      />

      {/* Profile Card */}
      <div className="mb-6 p-5 bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl text-white">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <div>
            <p className="text-primary-200 text-sm">{faculty.designation}</p>
            <p className="text-xl font-bold">{faculty.first_name} {faculty.last_name}</p>
            <p className="text-primary-200 text-sm mt-0.5">
              {faculty.department?.name || 'N/A'} • {faculty.employee_code}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card p-4 bg-blue-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Subjects</p>
              <p className="text-xl font-bold text-gray-900">{subject_count}</p>
            </div>
          </div>
        </div>
        <div className="card p-4 bg-green-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Today's Classes</p>
              <p className="text-xl font-bold text-gray-900">{today_timetable.length}</p>
            </div>
          </div>
        </div>
        <div className="card p-4 bg-yellow-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Marked Today</p>
              <p className="text-xl font-bold text-gray-900">{attendance_stats.marked_today}</p>
            </div>
          </div>
        </div>
        <div className="card p-4 bg-purple-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Classes</p>
              <p className="text-xl font-bold text-gray-900">{attendance_stats.total_classes}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Timetable */}
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-600" />
            Today's Schedule ({today})
          </h3>
          <div className="space-y-3">
            {today_timetable.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">
                No classes scheduled for today
              </p>
            ) : (
              today_timetable.map((tt) => (
                <div
                  key={tt.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                >
                  <div>
                    <p className="font-medium text-sm text-gray-900">{tt.subject?.name}</p>
                    <p className="text-xs text-gray-500">{tt.program?.name}</p>
                    <p className="text-xs text-gray-400">Room: {tt.room_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-primary-600">
                      {new Date(tt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                      {new Date(tt.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <a
                      href={`/faculty/attendance/${tt.id}`}
                      className="text-xs text-primary-600 hover:underline"
                    >
                      Mark Attendance →
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <a
              href="/faculty/timetable"
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="p-2 bg-primary-100 rounded-lg">
                <Calendar className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900">View Full Timetable</p>
                <p className="text-xs text-gray-500">Check your weekly schedule</p>
              </div>
            </a>
            <a
              href="/faculty/attendance"
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900">Mark Attendance</p>
                <p className="text-xs text-gray-500">Record student attendance</p>
              </div>
            </a>
            <a
              href="/notifications"
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900">Notifications</p>
                <p className="text-xs text-gray-500">View your notifications</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
}
