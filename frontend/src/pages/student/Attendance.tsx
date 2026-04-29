import React, { useEffect, useState } from "react";
import Layout from "../../components/shared/Layout";
import PageHeader from "../../components/shared/PageHeader";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import api from "../../api/axios";
import type { Attendance } from "../../types";
import { Calendar, CheckCircle, XCircle, Clock, BookOpen, TrendingUp, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

export default function StudentAttendance() {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      let url = "/student/attendance";
      if (startDate && endDate) {
        url += `?start_date=${startDate}&end_date=${endDate}`;
      }
      const res = await api.get(url);
      setAttendances(res.data.data.attendances || []);
      setStats(res.data.data.statistics);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to fetch attendance");
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    fetchAttendance();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present": return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "absent": return <XCircle className="w-4 h-4 text-red-600" />;
      case "late": return <Clock className="w-4 h-4 text-yellow-600" />;
      case "on_leave": return <Calendar className="w-4 h-4 text-blue-600" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present": return "bg-green-100 text-green-700";
      case "absent": return "bg-red-100 text-red-700";
      case "late": return "bg-yellow-100 text-yellow-700";
      case "on_leave": return "bg-blue-100 text-blue-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <PageHeader
        title="My Attendance"
        subtitle="View your attendance records"
      />

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Percentage</p>
                <p className={`text-xl font-bold ${stats.percentage >= 75 ? "text-green-600" : stats.percentage >= 60 ? "text-yellow-600" : "text-red-600"}`}>
                  {stats.percentage.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
          <div className="card p-4 bg-green-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Present</p>
                <p className="text-xl font-bold text-gray-900">{stats.present}</p>
              </div>
            </div>
          </div>
          <div className="card p-4 bg-yellow-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Late</p>
                <p className="text-xl font-bold text-gray-900">{stats.late}</p>
              </div>
            </div>
          </div>
          <div className="card p-4 bg-red-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Absent</p>
                <p className="text-xl font-bold text-gray-900">{stats.absent}</p>
              </div>
            </div>
          </div>
          <div className="card p-4 bg-blue-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">On Leave</p>
                <p className="text-xl font-bold text-gray-900">{stats.leave}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Alert */}
      {stats && stats.percentage < 75 && (
        <div className="card mb-6 bg-red-50 border-red-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <div>
              <p className="font-medium text-red-900">Attendance Alert!</p>
              <p className="text-sm text-red-700">
                Your attendance is below 75%. Please attend classes regularly to meet the minimum requirement.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Date Filter */}
      <div className="card mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-field"
            />
          </div>
          <button
            onClick={handleFilter}
            className="btn-primary"
          >
            Apply Filter
          </button>
        </div>
      </div>

      {/* Attendance List */}
      <div className="card">
        <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary-600" />
          Attendance History
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Subject</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Faculty</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {attendances.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">
                    {record.attendance_date ? new Date(record.attendance_date).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{record.subject?.name}</div>
                    <div className="text-xs text-gray-500">{record.subject?.code}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {record.faculty?.first_name} {record.faculty?.last_name}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                      {getStatusIcon(record.status)}
                      {record.status?.charAt(0).toUpperCase() + record.status?.slice(1).replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {record.remarks || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {attendances.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No attendance records found</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
