import React, { useEffect, useState } from "react";
import Layout from "../../components/shared/Layout";
import PageHeader from "../../components/shared/PageHeader";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import api from "../../api/axios";
import type { Event, Holiday } from "../../types";
import { Calendar, Plus, Clock, MapPin, Users, Trash2, PartyPopper, GraduationCap, Trophy, Stethoscope, BookOpen, Flag } from "lucide-react";
import toast from "react-hot-toast";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay } from "date-fns";

export default function CollegeEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_type: "academic",
    start_date: "",
    end_date: "",
    venue: "",
    organizer: "",
    is_public: true,
    is_holiday: false,
  });

  useEffect(() => {
    fetchData();
  }, [currentMonth]);

  const fetchData = async () => {
    try {
      const monthStr = format(currentMonth, "yyyy-MM");
      const [eventsRes, holidaysRes] = await Promise.all([
        api.get(`/admin/events?month=${monthStr}`),
        api.get("/admin/holidays"),
      ]);
      setEvents(eventsRes.data.data || []);
      setHolidays(holidaysRes.data.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/admin/events", formData);
      toast.success("Event created successfully");
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to create event");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await api.delete(`/admin/events/${id}`);
      toast.success("Event deleted");
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete event");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      event_type: "academic",
      start_date: "",
      end_date: "",
      venue: "",
      organizer: "",
      is_public: true,
      is_holiday: false,
    });
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "academic": return <GraduationCap className="w-4 h-4" />;
      case "cultural": return <PartyPopper className="w-4 h-4" />;
      case "sports": return <Trophy className="w-4 h-4" />;
      case "exam": return <BookOpen className="w-4 h-4" />;
      case "holiday": return <Flag className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "academic": return "bg-blue-100 text-blue-700 border-blue-200";
      case "cultural": return "bg-purple-100 text-purple-700 border-purple-200";
      case "sports": return "bg-green-100 text-green-700 border-green-200";
      case "exam": return "bg-red-100 text-red-700 border-red-200";
      case "holiday": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  // Calendar generation
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <PageHeader
        title="Events & Calendar"
        subtitle="Manage university events and holidays"
        actions={
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Event
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                {format(currentMonth, "MMMM yyyy")}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ←
                </button>
                <button
                  onClick={() => setCurrentMonth(new Date())}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Today
                </button>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  →
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center py-2 text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
              {Array.from({ length: startDay }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {calendarDays.map((day) => {
                const dayEvents = events.filter((e) => e.event_date && isSameDay(new Date(e.event_date), day));
                const isHoliday = holidays.some((h) => h.date && isSameDay(new Date(h.date), day));
                return (
                  <div
                    key={day.toISOString()}
                    className={`aspect-square border rounded-lg p-2 ${
                      isSameDay(day, new Date()) ? "border-primary-500 bg-primary-50" : "border-gray-200"
                    } ${isHoliday ? "bg-yellow-50" : ""}`}
                  >
                    <div className="text-sm font-medium text-gray-700">{format(day, "d")}</div>
                    <div className="space-y-1 mt-1">
                      {dayEvents.slice(0, 2).map((e) => (
                        <div
                          key={e.id}
                          className={`text-xs px-1 py-0.5 rounded truncate ${getEventColor(e.event_type)}`}
                        >
                          {e.event_name}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-gray-500">+{dayEvents.length - 2} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <div className="card">
            <h3 className="font-bold text-lg text-gray-900 mb-4">Upcoming Events</h3>
            <div className="space-y-3">
              {events
                .filter((e) => e.event_date && new Date(e.event_date) >= new Date())
                .sort((a, b) => (a.event_date && b.event_date) ? new Date(a.event_date).getTime() - new Date(b.event_date).getTime() : 0)
                .slice(0, 5)
                .map((event) => (
                  <div
                    key={event.id}
                    className={`p-3 rounded-xl border ${getEventColor(event.event_type)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getEventIcon(event.event_type)}
                        <span className="font-medium text-sm">{event.event_name}</span>
                      </div>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="mt-2 text-xs space-y-1">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {event.event_date ? format(new Date(event.event_date), "MMM d, yyyy") : 'TBD'}
                      </div>
                      {event.venue && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.venue}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              {events.filter((e) => e.event_date && new Date(e.event_date) >= new Date()).length === 0 && (
                <p className="text-gray-500 text-center py-4">No upcoming events</p>
              )}
            </div>
          </div>

          {/* Holidays */}
          <div className="card">
            <h3 className="font-bold text-lg text-gray-900 mb-4">Holidays</h3>
            <div className="space-y-2">
              {holidays.slice(0, 5).map((holiday) => (
                <div key={holiday.id} className="flex items-center gap-3 p-2 bg-yellow-50 rounded-lg">
                  <Flag className="w-4 h-4 text-yellow-600" />
                  <div>
                    <p className="font-medium text-sm">{holiday.name}</p>
                    <p className="text-xs text-gray-500">
                      {holiday.date ? format(new Date(holiday.date), "MMM d, yyyy") : 'TBD'}
                    </p>
                  </div>
                </div>
              ))}
              {holidays.length === 0 && (
                <p className="text-gray-500 text-center py-4">No holidays set</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Add New Event</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input-field w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                  <select
                    value={formData.event_type}
                    onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                    className="input-field w-full"
                  >
                    <option value="academic">Academic</option>
                    <option value="cultural">Cultural</option>
                    <option value="sports">Sports</option>
                    <option value="exam">Exam</option>
                    <option value="holiday">Holiday</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-field w-full"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                    <input
                      type="datetime-local"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="input-field w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                    <input
                      type="datetime-local"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="input-field w-full"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    className="input-field w-full"
                    placeholder="e.g., Main Auditorium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organizer</label>
                  <input
                    type="text"
                    value={formData.organizer}
                    onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                    className="input-field w-full"
                  />
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_public}
                      onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Public Event</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_holiday}
                      onChange={(e) => setFormData({ ...formData, is_holiday: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Holiday</span>
                  </label>
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
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
