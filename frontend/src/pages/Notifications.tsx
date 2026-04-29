import React, { useEffect, useState } from "react";
import Layout from "../components/shared/Layout";
import PageHeader from "../components/shared/PageHeader";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import api from "../api/axios";
import { Bell, CheckCheck } from "lucide-react";
import { Notification } from "../types";
import toast from "react-hot-toast";

const typeStyles: Record<string, string> = {
  success: "border-l-4 border-green-400 bg-green-50",
  warning: "border-l-4 border-yellow-400 bg-yellow-50",
  error:   "border-l-4 border-red-400   bg-red-50",
  info:    "border-l-4 border-blue-400  bg-blue-50",
};

export default function Notifications() {
  const [notifs, setNotifs]   = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = () => {
    api.get("/notifications").then((r) => {
      setNotifs(r.data.data || []);
      setLoading(false);
    });
  };

  useEffect(() => { fetchNotifs(); }, []);

  const markAllRead = async () => {
    try {
      await api.put("/notifications/read");
      toast.success("All notifications marked as read");
      fetchNotifs();
    } catch {
      toast.error("Failed to mark as read");
    }
  };

  const unreadCount = notifs.filter((n) => !n.is_read).length;

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <PageHeader
        title="Notifications"
        subtitle={`${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`}
        actions={
          unreadCount > 0 ? (
            <button
              onClick={markAllRead}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <CheckCheck className="w-4 h-4" /> Mark All Read
            </button>
          ) : undefined
        }
      />

      {notifs.length === 0 ? (
        <div className="card text-center py-16">
          <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 font-medium">No notifications</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifs.map((n) => (
            <div
              key={n.id}
              className={`card py-4 ${typeStyles[n.type || 'info'] || typeStyles.info} ${
                !n.is_read ? "shadow-sm" : "opacity-70"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">
                    {n.title}
                    {!n.is_read && (
                      <span className="ml-2 inline-block w-2 h-2
                                       bg-blue-500 rounded-full align-middle" />
                    )}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                </div>
                <p className="text-xs text-gray-400 flex-shrink-0">
                  {n.created_at ? new Date(n.created_at).toLocaleDateString() : '-'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}