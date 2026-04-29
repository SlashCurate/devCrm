import React, { useEffect, useState } from "react";
import Layout from "../../components/shared/Layout";
import PageHeader from "../../components/shared/PageHeader";
import StatCard from "../../components/shared/StatCard";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import api from "../../api/axios";
import {
  Users, Building2, BookOpen, ClipboardList,
  GraduationCap, IndianRupee,
} from "lucide-react";

interface Stats {
  total_students: number;
  total_colleges: number;
  total_courses: number;
  pending_applications: number;
  enrolled_students: number;
  total_revenue: number;
}

export default function AdminDashboard() {
  const [stats, setStats]     = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/dashboard").then((res) => {
      setStats(res.data.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <PageHeader
        title="University Dashboard"
        subtitle="Complete overview of the university system"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        <StatCard
          title="Total Students"
          value={stats?.total_students || 0}
          icon={GraduationCap}
          color="blue"
        />
        <StatCard
          title="Total Colleges"
          value={stats?.total_colleges || 0}
          icon={Building2}
          color="green"
        />
        <StatCard
          title="Total Courses"
          value={stats?.total_courses || 0}
          icon={BookOpen}
          color="purple"
        />
        <StatCard
          title="Pending Applications"
          value={stats?.pending_applications || 0}
          icon={ClipboardList}
          color="yellow"
        />
        <StatCard
          title="Enrolled Students"
          value={stats?.enrolled_students || 0}
          icon={Users}
          color="indigo"
        />
        <StatCard
          title="Total Revenue"
          value={`₹${((stats?.total_revenue || 0) / 100000).toFixed(1)}L`}
          icon={IndianRupee}
          color="green"
          subtitle="Across all colleges"
        />
      </div>
    </Layout>
  );
}