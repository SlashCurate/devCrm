import React, { useEffect, useState } from "react";
import Layout from "../../components/shared/Layout";
import PageHeader from "../../components/shared/PageHeader";
import StatCard from "../../components/shared/StatCard";
import StatusBadge from "../../components/shared/StatusBadge";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import api from "../../api/axios";
import { IndianRupee, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { Payment } from "../../types";

interface FinanceStats {
  total_collected: number;
  total_pending: number;
  total_payments: number;
  success_payments: number;
  pending_payments: number;
  recent_payments: Payment[];
}

export default function FinanceDashboard() {
  const [stats, setStats]     = useState<FinanceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/finance/dashboard").then((r) => {
      setStats(r.data.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <PageHeader
        title="Finance Dashboard"
        subtitle="Payment overview and fee management"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Collected"
          value={`₹${((stats?.total_collected || 0) / 1000).toFixed(0)}K`}
          icon={IndianRupee}
          color="green"
        />
        <StatCard
          title="Total Pending"
          value={`₹${((stats?.total_pending || 0) / 1000).toFixed(0)}K`}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="Successful Payments"
          value={stats?.success_payments || 0}
          icon={CheckCircle}
          color="blue"
        />
        <StatCard
          title="Pending Payments"
          value={stats?.pending_payments || 0}
          icon={TrendingUp}
          color="red"
        />
      </div>

      {/* Recent Payments */}
      <div className="card">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Recent Payments
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {["Receipt","Student","Amount","Fee Type","Status","Date"].map(
                  (h) => (
                    <th key={h}
                      className="text-left px-4 py-3 text-xs font-semibold
                                 text-gray-500 uppercase">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats?.recent_payments?.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    {p.receipt_number}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {p.student?.first_name ? `${p.student.first_name} ${p.student.last_name}` : "—"}
                  </td>
                  <td className="px-4 py-3 font-semibold text-green-600">
                    ₹{p.amount_paid?.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {p.invoice?.invoice_number || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {p.payment_date
                      ? new Date(p.payment_date).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}