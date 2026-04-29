import React, { useEffect, useState } from "react";
import Layout from "../../components/shared/Layout";
import PageHeader from "../../components/shared/PageHeader";
import StatCard from "../../components/shared/StatCard";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import api from "../../api/axios";
import { FileText, Send, BarChart3, Clock, Calendar } from "lucide-react";
import { Exam } from "../../types";

interface RegistrarStats {
  total_exams:     number;
  published_exams: number;
  total_results:   number;
  pending_results: number;
  upcoming_exams:  Exam[];
}

export default function RegistrarDashboard() {
  const [stats, setStats]     = useState<RegistrarStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/registrar/dashboard").then((r) => {
      setStats(r.data.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <PageHeader
        title="Registrar Dashboard"
        subtitle="Manage exams and results"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Exams"
          value={stats?.total_exams || 0}
          icon={FileText}
          color="blue"
        />
        <StatCard
          title="Published Exams"
          value={stats?.published_exams || 0}
          icon={Send}
          color="green"
        />
        <StatCard
          title="Total Results"
          value={stats?.total_results || 0}
          icon={BarChart3}
          color="purple"
        />
        <StatCard
          title="Pending Results"
          value={stats?.pending_results || 0}
          icon={Clock}
          color="yellow"
        />
      </div>

      {/* Upcoming Exams */}
      <div className="card">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex
                       items-center gap-2">
          <Calendar className="w-5 h-5 text-primary-500" />
          Upcoming Exams
        </h2>
        {!stats?.upcoming_exams?.length ? (
          <p className="text-gray-400 text-sm text-center py-8">
            No upcoming exams scheduled
          </p>
        ) : (
          <div className="space-y-3">
            {stats.upcoming_exams.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between p-4
                           bg-gray-50 rounded-xl hover:bg-gray-100
                           transition-colors"
              >
                <div>
                  <p className="font-semibold text-gray-900">{e.name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {e.program?.name} • {e.subject?.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Semester {e.semester?.semester_number || e.semester_id}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary-600">
                    {e.exam_date ? new Date(e.exam_date).toLocaleDateString("en-IN", {
                      day:   "2-digit",
                      month: "short",
                      year:  "numeric",
                    }) : "TBA"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {e.duration} mins • {e.max_marks} marks
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}