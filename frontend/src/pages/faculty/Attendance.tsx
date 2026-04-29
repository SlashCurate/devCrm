import React, { useEffect, useState } from "react";
import Layout from "../../components/shared/Layout";
import PageHeader from "../../components/shared/PageHeader";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import api from "../../api/axios";
import { Timetable, Student } from "../../types";
import { Calendar, Users, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

interface StudentAttendance {
  id?: number;
  user_id?: number;
  first_name: string;
  last_name: string;
  enrollment_number?: string;
  status: "present" | "absent" | "late" | "on_leave";
  remarks: string;
  is_marked: boolean;
}

export default function FacultyAttendance() {
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [selectedTimetable, setSelectedTimetable] = useState<number | "">("");
  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTimetables();
  }, []);

  useEffect(() => {
    if (selectedTimetable) {
      fetchStudentsForAttendance();
    }
  }, [selectedTimetable, date]);

  const fetchTimetables = async () => {
    try {
      const res = await api.get("/faculty/timetable");
      setTimetables(res.data.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to fetch timetables");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsForAttendance = async () => {
    try {
      const res = await api.get(`/faculty/attendance/students/${selectedTimetable}?date=${date}`);
      setStudents(res.data.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to fetch students");
    }
  };

  const handleStatusChange = (studentId: number, status: StudentAttendance["status"]) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, status } : s))
    );
  };

  const handleRemarksChange = (studentId: number, remarks: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, remarks } : s))
    );
  };

  const handleMarkAll = (status: StudentAttendance["status"]) => {
    setStudents((prev) =>
      prev.map((s) => ({ ...s, status }))
    );
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await api.post("/faculty/attendance/mark", {
        timetable_id: selectedTimetable,
        date: date,
        students: students.map((s) => ({
          student_id: s.id,
          status: s.status,
          remarks: s.remarks,
        })),
      });
      toast.success("Attendance marked successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to mark attendance");
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present": return "bg-green-100 text-green-700 border-green-300";
      case "absent": return "bg-red-100 text-red-700 border-red-300";
      case "late": return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "on_leave": return "bg-blue-100 text-blue-700 border-blue-300";
      default: return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const selectedTimetableData = timetables.find((t) => t.id === Number(selectedTimetable));

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <PageHeader
        title="Mark Attendance"
        subtitle="Record daily attendance for your classes"
      />

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
            <select
              value={selectedTimetable}
              onChange={(e) => setSelectedTimetable(e.target.value === "" ? "" : Number(e.target.value))}
              className="input-field w-full"
            >
              <option value="">Choose a class</option>
              {timetables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.subject?.name} - {t.program?.name} ({new Date(t.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input-field w-full"
            />
          </div>
        </div>
      </div>

      {selectedTimetable && (
        <>
          {/* Class Info */}
          <div className="card mb-6 bg-blue-50">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">
                  {selectedTimetableData?.subject?.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {selectedTimetableData?.program?.name} • Semester {selectedTimetableData?.semester?.semester_number}
                </p>
                <p className="text-sm text-gray-500">
                  Room: {selectedTimetableData?.room_number} • Time: {new Date(selectedTimetableData?.start_time || "").toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(selectedTimetableData?.end_time || "").toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => handleMarkAll("present")}
              className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm font-medium"
            >
              Mark All Present
            </button>
            <button
              onClick={() => handleMarkAll("absent")}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium"
            >
              Mark All Absent
            </button>
          </div>

          {/* Students List */}
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-600" />
              Student Attendance
            </h3>
            {students.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No students enrolled in this course</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Student</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Enrollment No.</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-primary-600">
                                {student.first_name?.[0]}{student.last_name?.[0]}
                              </span>
                            </div>
                            <div className="font-medium text-gray-900">
                              {student.first_name} {student.last_name}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{student.enrollment_number || "N/A"}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center gap-1">
                            {["present", "absent", "late", "on_leave"].map((status) => (
                              <button
                                key={status}
                                onClick={() => handleStatusChange(student.id || 0, status as StudentAttendance["status"])}
                                className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                                  student.status === status
                                    ? getStatusColor(status)
                                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                                }`}
                              >
                                {status === "on_leave" ? "Leave" : status.charAt(0).toUpperCase() + status.slice(1)}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={student.remarks}
                            onChange={(e) => handleRemarksChange(student.id || 0, e.target.value)}
                            className="input-field w-full text-sm"
                            placeholder="Optional remarks"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Submit Button */}
          {students.length > 0 && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="btn-primary flex items-center gap-2"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                {saving ? "Saving..." : "Save Attendance"}
              </button>
            </div>
          )}
        </>
      )}

      {!selectedTimetable && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Select a class to mark attendance</p>
        </div>
      )}
    </Layout>
  );
}
