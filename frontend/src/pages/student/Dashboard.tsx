import React, { useEffect, useState } from "react";
import Layout from "../../components/shared/Layout";
import PageHeader from "../../components/shared/PageHeader";
import StatCard from "../../components/shared/StatCard";
import StatusBadge from "../../components/shared/StatusBadge";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import api from "../../api/axios";
import { GraduationCap, FileText, CreditCard, BarChart3 } from "lucide-react";
import { Student, Application, Payment, Notification } from "../../types";

interface DashboardData {
  student: Student;
  applications: Application[];
  payments: Payment[];
  pending_fees: any[];
  notifications: Notification[];
}

export default function StudentDashboard() {
  const [data, setData]       = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/student/dashboard").then((r) => {
      setData(r.data.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><LoadingSpinner /></Layout>;
  if (!data)   return <Layout><p>No data found</p></Layout>;

  const { student, applications, payments, pending_fees, notifications } = data;

  return (
    <Layout>
      <PageHeader
        title={`Welcome, ${student.first_name || "Student"}! 👋`}
        subtitle="Your academic portal overview"
      />

      {/* Enrollment Card */}
      {student.enrollment_number && (
        <div className="mb-6 p-5 bg-gradient-to-r from-primary-600
                        to-primary-800 rounded-2xl text-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-primary-200 text-sm">Enrollment Number</p>
              <p className="text-2xl font-bold tracking-wider">
                {student.enrollment_number}
              </p>
              <p className="text-primary-200 text-sm mt-0.5">
                {student.program?.name}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Applications"
          value={applications.length}
          icon={FileText}
          color="blue"
        />
        <StatCard
          title="Payments Made"
          value={payments.filter((p) => p.status === "Success").length}
          icon={CreditCard}
          color="green"
        />
        <StatCard
          title="Pending Fees"
          value={pending_fees?.length || 0}
          icon={CreditCard}
          color="yellow"
        />
        <StatCard
          title="Status"
          value={student.is_active ? "ACTIVE" : "INACTIVE"}
          icon={GraduationCap}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications */}
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">My Applications</h3>
          <div className="space-y-3">
            {applications.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">
                No applications yet.
                <a href="/student/apply"
                  className="text-primary-600 ml-1 hover:underline">
                  Apply now →
                </a>
              </p>
            ) : (
              applications.map((app) => (
                <div key={app.id}
                  className="flex items-center justify-between p-3
                             bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-sm text-gray-900">
                      {app.program?.name}
                    </p>
                    <p className="text-xs text-gray-500">{app.college?.name}</p>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">
            Notifications
          </h3>
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">
                No notifications
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 rounded-xl border-l-4 ${
                    n.type === "success"
                      ? "border-green-400 bg-green-50"
                      : n.type === "warning"
                      ? "border-yellow-400 bg-yellow-50"
                      : "border-blue-400 bg-blue-50"
                  }`}
                >
                  <p className="font-medium text-sm text-gray-900">
                    {n.title}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}