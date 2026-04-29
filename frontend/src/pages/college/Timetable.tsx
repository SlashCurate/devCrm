import React, { useEffect, useState } from "react";
import Layout from "../../components/shared/Layout";
import PageHeader from "../../components/shared/PageHeader";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import api from "../../api/axios";
import type { Timetable, Subject, Faculty, Program } from "../../types";
import { Calendar, Plus, Clock, MapPin, Trash2, Edit2 } from "lucide-react";
import toast from "react-hot-toast";

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function CollegeTimetable() {
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<number | "">("");
  const [selectedDay, setSelectedDay] = useState<number | "">("");

  const [formData, setFormData] = useState({
    program_id: "",
    subject_id: "",
    faculty_id: "",
    day_of_week: "",
    start_time: "",
    end_time: "",
    room_number: "",
    semester: "1",
    academic_year: new Date().getFullYear().toString(),
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [timetableRes, subjectRes, facultyRes, courseRes] = await Promise.all([
        api.get("/college/timetable"),
        api.get("/college/subjects"),
        api.get("/college/faculty"),
        api.get("/college/programs"),
      ]);
      setTimetables(timetableRes.data.data || []);
      setSubjects(subjectRes.data.data || []);
      setFaculty(facultyRes.data.data || []);
      setPrograms(courseRes.data.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/college/timetable", {
        ...formData,
        program_id: parseInt(formData.program_id),
        subject_id: parseInt(formData.subject_id),
        faculty_id: parseInt(formData.faculty_id),
        day_of_week: parseInt(formData.day_of_week),
        semester: parseInt(formData.semester),
      });
      toast.success("Timetable entry added successfully");
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to add timetable");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this timetable entry?")) return;
    try {
      await api.delete(`/college/timetable/${id}`);
      toast.success("Timetable entry deleted");
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete");
    }
  };

  const resetForm = () => {
    setFormData({
      program_id: "",
      subject_id: "",
      faculty_id: "",
      day_of_week: "",
      start_time: "",
      end_time: "",
      room_number: "",
      semester: "1",
      academic_year: new Date().getFullYear().toString(),
    });
  };

  const filteredTimetables = timetables.filter((t) => {
    if (selectedProgram && t.program_id !== Number(selectedProgram)) return false;
    if (selectedDay !== "" && t.day_of_week !== Number(selectedDay)) return false;
    return true;
  });

  const groupedByDay = filteredTimetables.reduce((acc, t) => {
    if (!acc[t.day_of_week!]) acc[t.day_of_week!] = [];
    acc[t.day_of_week!].push(t);
    return acc;
  }, {} as Record<number, Timetable[]>);

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <PageHeader
        title="Timetable Management"
        subtitle="Manage class schedules and timings"
        actions={
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Schedule
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <select
          value={selectedProgram}
          onChange={(e) => setSelectedProgram(e.target.value === "" ? "" : Number(e.target.value))}
          className="input-field"
        >
          <option value="">All Programs</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select
          value={selectedDay}
          onChange={(e) => setSelectedDay(e.target.value === "" ? "" : Number(e.target.value))}
          className="input-field"
        >
          <option value="">All Days</option>
          {daysOfWeek.map((day, index) => (
            <option key={index} value={index}>{day}</option>
          ))}
        </select>
      </div>

      {/* Timetable Grid */}
      <div className="space-y-6">
        {daysOfWeek.map((dayName, dayIndex) => {
          const daySchedules = groupedByDay[dayIndex] || [];
          if (selectedDay !== "" && dayIndex !== Number(selectedDay)) return null;
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
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Faculty</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Room</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Program</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {daySchedules.sort((a, b) => a.start_time!.localeCompare(b.start_time!)).map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-gray-400" />
                            {new Date(t.start_time!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                            {new Date(t.end_time!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{t.subject?.name}</div>
                          <div className="text-xs text-gray-500">{t.subject?.code}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {t.faculty?.first_name} {t.faculty?.last_name}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            {t.room_number}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{t.program?.name}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {filteredTimetables.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No timetable entries found</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Add Timetable Entry</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                  <select
                    value={formData.program_id}
                    onChange={(e) => setFormData({ ...formData, program_id: e.target.value })}
                    className="input-field w-full"
                    required
                  >
                    <option value="">Select Program</option>
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <select
                      value={formData.subject_id}
                      onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                      className="input-field w-full"
                      required
                    >
                      <option value="">Select subject</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Faculty</label>
                    <select
                      value={formData.faculty_id}
                      onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value })}
                      className="input-field w-full"
                      required
                    >
                      <option value="">Select Faculty</option>
                      {faculty.map((f) => (
                        <option key={f.id} value={f.id}>{f.first_name} {f.last_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                  <select
                    value={formData.day_of_week}
                    onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
                    className="input-field w-full"
                    required
                  >
                    <option value="">Select Day</option>
                    {daysOfWeek.map((day, index) => (
                      <option key={index} value={index}>{day}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      className="input-field w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                    <input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      className="input-field w-full"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
                    <input
                      type="text"
                      value={formData.room_number}
                      onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                      className="input-field w-full"
                      placeholder="e.g., 101-A"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                    <select
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                      className="input-field w-full"
                      required
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={s}>Semester {s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
