import React, { useEffect, useState } from "react";
import Layout from "../../components/shared/Layout";
import PageHeader from "../../components/shared/PageHeader";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import api from "../../api/axios";
import type { Program, Attendance } from "../../types";
import { Calendar, Users, CheckCircle, XCircle, Clock, FileText } from "lucide-react";
import toast from "react-hot-toast";

interface AttendanceSummary {
  student_id: number;
  name: string;
  total: number;
  present: number;
  percentage: number;
}

interface TimetableAttendance {
  id: number;
  date: string;
  status: string;
  student?: {
    id: number;
    first_name: string;
    last_name: string;
  };
}

export default function CollegeAttendance() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<number | "">("");
  const [attendanceData, setAttendanceData] = useState<AttendanceSummary[]>([]);
  const [timetableAttendance, setTimetableAttendance] = useState<TimetableAttendance[]>([]);
  const [selectedTimetable, setSelectedTimetable] = useState<number | "">("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"summary" | "detailed">("summary");

  useEffect(() => {
    fetchPrograms();
  }, []);

  useEffect(() => {
    if (selectedProgram) {
      fetchAttendanceSummary();
    }
  }, [selectedProgram]);

  useEffect(() => {
    if (selectedTimetable) {
      fetchTimetableAttendance();
    }
  }, [selectedTimetable]);

  const fetchPrograms = async () => {
    try {
      const res = await api.get("/college/programs");
      setPrograms(res.data.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to fetch programs");
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceSummary = async () => {
    try {
      const res = await api.get(`/college/attendance/program/${selectedProgram}`);
      setAttendanceData(res.data.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to fetch attendance");
    }
  };

  const fetchTimetableAttendance = async () => {
    try {
      const res = await api.get(`/college/attendance/timetable/${selectedTimetable}`);
      setTimetableAttendance(res.data.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to fetch attendance");
    }
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 75) return "text-green-600 bg-green-50";
    if (percentage >= 60) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <PageHeader
        title="Attendance Reports"
        subtitle="View and monitor student attendance"
      />

      {/* Course Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Program</label>
        <select
          value={selectedProgram}
          onChange={(e) => setSelectedProgram(e.target.value === "" ? "" : Number(e.target.value))}
          className="input-field max-w-md"
        >
          <option value="">Select a program</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab("summary")}
          className={`px-4 py-2 rounded-xl font-medium transition-colors ${
            activeTab === "summary" ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          Student Summary
        </button>
        <button
          onClick={() => setActiveTab("detailed")}
          className={`px-4 py-2 rounded-xl font-medium transition-colors ${
            activeTab === "detailed" ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <Calendar className="w-4 h-4 inline mr-2" />
          Class-wise Report
        </button>
      </div>

      {/* Summary Tab */}
      {activeTab === "summary" && (
        <div className="card">
          <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-600" />
            Student Attendance Summary
          </h3>
          {selectedProgram ? (
            attendanceData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Student</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Total Classes</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Present</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Percentage</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {attendanceData.map((student) => (
                      <tr key={student.student_id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{student.name}</div>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600">{student.total}</td>
                        <td className="px-4 py-3 text-center text-gray-600">{student.present}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-medium ${getStatusColor(student.percentage)} px-3 py-1 rounded-full text-sm`}>
                            {student.percentage.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {student.percentage >= 75 ? (
                            <span className="text-green-600 flex items-center justify-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              Good
                            </span>
                          ) : student.percentage >= 60 ? (
                            <span className="text-yellow-600 flex items-center justify-center gap-1">
                              <Clock className="w-4 h-4" />
                              Average
                            </span>
                          ) : (
                            <span className="text-red-600 flex items-center justify-center gap-1">
                              <XCircle className="w-4 h-4" />
                              At Risk
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No attendance data available for this program</p>
              </div>
            )
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Please select a program to view attendance summary</p>
            </div>
          )}
        </div>
      )}

      {/* Detailed Tab */}
      {activeTab === "detailed" && (
        <div className="card">
          <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-600" />
            Class-wise Attendance
          </h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Timetable Entry</label>
            <select
              value={selectedTimetable}
              onChange={(e) => setSelectedTimetable(e.target.value === "" ? "" : Number(e.target.value))}
              className="input-field max-w-md"
            >
              <option value="">Select a class schedule</option>
              {/* This would be populated from timetable data */}
            </select>
          </div>
          {selectedTimetable && timetableAttendance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Student</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {timetableAttendance.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">{new Date(record.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        {record.student ? `${record.student.first_name} ${record.student.last_name}` : "Unknown"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          record.status === "present" ? "bg-green-100 text-green-700" :
                          record.status === "absent" ? "bg-red-100 text-red-700" :
                          record.status === "late" ? "bg-yellow-100 text-yellow-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Select a timetable entry to view detailed attendance</p>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
