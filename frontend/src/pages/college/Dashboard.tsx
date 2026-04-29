import React, { useEffect, useState } from "react";
import Layout from "../../components/shared/Layout";
import PageHeader from "../../components/shared/PageHeader";
import StatCard from "../../components/shared/StatCard";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import api from "../../api/axios";
import { Users, BookOpen, ClipboardList, GraduationCap } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function CollegeDashboard() {
  const { user }              = useAuth();
  const [stats, setStats]     = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/college/dashboard").then((r) => {
      setStats(r.data.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <PageHeader
        title="College Dashboard"
        subtitle={`Welcome, ${user?.username}`}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        <StatCard title="Total Students"    value={stats?.total_students   || 0} icon={Users}        color="blue"   />
        <StatCard title="Total Courses"     value={stats?.total_courses    || 0} icon={BookOpen}     color="purple" />
        <StatCard title="Pending Apps"      value={stats?.pending_apps     || 0} icon={ClipboardList} color="yellow" />
        <StatCard title="Shortlisted"       value={stats?.shortlisted_apps || 0} icon={ClipboardList} color="indigo" />
        <StatCard title="Enrolled Students" value={stats?.enrolled_students|| 0} icon={GraduationCap} color="green"  />
      </div>
    </Layout>
  );
}