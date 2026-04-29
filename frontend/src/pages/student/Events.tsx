import React, { useEffect, useState } from "react";
import Layout from "../../components/shared/Layout";
import PageHeader from "../../components/shared/PageHeader";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import api from "../../api/axios";
import { Event, Holiday } from "../../types";
import { Calendar, Clock, MapPin, PartyPopper, GraduationCap, Trophy, BookOpen, Flag, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay, isToday } from "date-fns";

export default function StudentEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [upcoming, setUpcoming] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchData();
  }, [currentMonth]);

  const fetchData = async () => {
    try {
      const monthStr = format(currentMonth, "yyyy-MM");
      const [eventsRes, holidaysRes, upcomingRes] = await Promise.all([
        api.get(`/student/events?month=${monthStr}`),
        api.get("/student/holidays"),
        api.get("/student/events/upcoming"),
      ]);
      setEvents(eventsRes.data.data || []);
      setHolidays(holidaysRes.data.data || []);
      setUpcoming(upcomingRes.data.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "academic": return <GraduationCap className="w-5 h-5" />;
      case "cultural": return <PartyPopper className="w-5 h-5" />;
      case "sports": return <Trophy className="w-5 h-5" />;
      case "exam": return <BookOpen className="w-5 h-5" />;
      case "holiday": return <Flag className="w-5 h-5" />;
      default: return <Calendar className="w-5 h-5" />;
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
        subtitle="Stay updated with university events and holidays"
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
                const dayEvents = events.filter((e) => isSameDay(new Date(e.event_date || Date.now()), day));
                const isHoliday = holidays.some((h) => isSameDay(new Date(h.date || Date.now()), day));
                return (
                  <div
                    key={day.toISOString()}
                    className={`aspect-square border rounded-lg p-2 ${
                      isToday(day) ? "border-primary-500 bg-primary-50" : "border-gray-200"
                    } ${isHoliday ? "bg-yellow-50" : ""}`}
                  >
                    <div className={`text-sm font-medium ${isToday(day) ? "text-primary-700" : "text-gray-700"}`}>
                      {format(day, "d")}
                    </div>
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

            {/* Legend */}
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
              {["academic", "cultural", "sports", "exam", "holiday"].map((type) => (
                <div key={type} className="flex items-center gap-1 text-xs">
                  <div className={`w-3 h-3 rounded ${getEventColor(type).split(" ")[0]}`} />
                  <span className="capitalize">{type.replace("_", " ")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <div className="card">
            <h3 className="font-bold text-lg text-gray-900 mb-4">Upcoming Events</h3>
            <div className="space-y-3">
              {upcoming.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No upcoming events</p>
              ) : (
                upcoming.map((event) => (
                  <div
                    key={event.id}
                    className={`p-3 rounded-xl border ${getEventColor(event.event_type)}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-white rounded-lg">
                        {getEventIcon(event.event_type)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{event.event_name}</h4>
                        <div className="mt-1 text-xs space-y-0.5">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(event.event_date || Date.now()), "MMM d, yyyy")}
                          </div>
                          {event.venue && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {event.venue}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Holidays */}
          <div className="card">
            <h3 className="font-bold text-lg text-gray-900 mb-4">Holidays</h3>
            <div className="space-y-2">
              {holidays.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No holidays in this year</p>
              ) : (
                holidays.slice(0, 5).map((holiday) => (
                  <div key={holiday.id} className="flex items-center gap-3 p-3 bg-yellow-50 rounded-xl">
                    <Flag className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-sm">{holiday.name}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(holiday.date || Date.now()), "MMMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* All Events List */}
          <div className="card">
            <h3 className="font-bold text-lg text-gray-900 mb-4">All Events</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {events
                .sort((a, b) => new Date(a.event_date || Date.now()).getTime() - new Date(b.event_date || Date.now()).getTime())
                .map((event) => (
                  <div key={event.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className={`p-2 rounded-lg ${getEventColor(event.event_type).split(" ")[0]}`}>
                      {getEventIcon(event.event_type)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{event.event_name}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {format(new Date(event.event_date || Date.now()), "MMM d, yyyy")}
                      </p>
                      {event.description && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{event.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              {events.length === 0 && (
                <p className="text-gray-500 text-center py-4">No events this month</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
