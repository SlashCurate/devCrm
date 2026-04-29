import React, { useEffect, useState } from "react";
import Layout from "../../components/shared/Layout";
import PageHeader from "../../components/shared/PageHeader";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import api from "../../api/axios";
import { Timetable } from "../../types";
import { Calendar, Clock, MapPin, BookOpen } from "lucide-react";
import toast from "react-hot-toast";

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function StudentTimetable() {
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    try {
      const res = await api.get("/student/timetable");
      setTimetables(res.data.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to fetch timetable");
    } finally {
      setLoading(false);
    }
  };

  const groupedByDay = timetables.reduce((acc, t) => {
    if (!acc[t.day_of_week!]) acc[t.day_of_week!] = [];
    acc[t.day_of_week!].push(t);
    return acc;
  }, {} as Record<number, Timetable[]>);

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <PageHeader
        title="My Timetable"
        subtitle="View your class schedule"
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
              <div className="space-y-3">
                {daySchedules
                  .sort((a, b) => a.start_time!.localeCompare(b.start_time!))
                  .map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[80px]">
                          <p className="text-sm font-bold text-primary-600">
                            {new Date(t.start_time!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(t.end_time!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="h-10 w-px bg-gray-300" />
                        <div>
                          <p className="font-medium text-gray-900">{t.subject?.name}</p>
                          <p className="text-xs text-gray-500">{t.subject?.code}</p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              Room {t.room_number}
                            </span>
                            <span>Semester {typeof t.semester === 'object' ? t.semester?.semester_number : t.semester}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{t.faculty?.first_name} {t.faculty?.last_name}</p>
                        <p className="text-xs text-gray-400">{t.faculty?.designation}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </div>

      {timetables.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No timetable available</p>
          <p className="text-sm text-gray-400 mt-1">Please contact your college administration</p>
        </div>
      )}
    </Layout>
  );
}
