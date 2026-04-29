import React, { useEffect, useState } from "react";
import Layout from "../../components/shared/Layout";
import PageHeader from "../../components/shared/PageHeader";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import api from "../../api/axios";
import { Timetable } from "../../types";
import { Calendar, Clock, MapPin, BookOpen } from "lucide-react";
import toast from "react-hot-toast";

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function FacultyTimetable() {
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    try {
      const res = await api.get("/faculty/timetable");
      setTimetables(res.data.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to fetch timetable");
    } finally {
      setLoading(false);
    }
  };

  const groupedByDay = timetables.reduce((acc, t) => {
    if (!acc[t.day_of_week]) acc[t.day_of_week] = [];
    acc[t.day_of_week].push(t);
    return acc;
  }, {} as Record<number, Timetable[]>);

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <PageHeader
        title="My Timetable"
        subtitle="View your weekly teaching schedule"
      />

      <div className="space-y-6">
        {daysOfWeek.map((dayName, dayIndex) => {
          const daySchedules = groupedByDay[dayIndex] || [];
          if (daySchedules.length === 0) return null;

          return (
            <div key={dayIndex} className="card">
              <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary-600" />
                {dayName}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Time</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Subject</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Course</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Room</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Semester</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {daySchedules
                      .sort((a, b) => a.start_time.localeCompare(b.start_time))
                      .map((t) => (
                        <tr key={t.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="w-4 h-4 text-gray-400" />
                              {new Date(t.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                              {new Date(t.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{t.subject?.name}</div>
                            <div className="text-xs text-gray-500">{t.subject?.code}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{t.program?.name}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              {t.room_number}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">Semester {t.semester?.semester_number || t.semester_id}</td>
                          <td className="px-4 py-3">
                            <a
                              href={`/faculty/attendance/${t.id}`}
                              className="text-sm text-primary-600 hover:underline"
                            >
                              Mark Attendance →
                            </a>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {timetables.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No timetable entries found</p>
          <p className="text-sm text-gray-400 mt-1">Contact your college admin to assign subjects</p>
        </div>
      )}
    </Layout>
  );
}
