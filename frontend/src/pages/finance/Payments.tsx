import React, { useEffect, useState } from "react";
import Layout from "../../components/shared/Layout";
import PageHeader from "../../components/shared/PageHeader";
import StatusBadge from "../../components/shared/StatusBadge";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import Modal from "../../components/shared/Modal";
import api from "../../api/axios";
import { Eye, Download } from "lucide-react";
import type { Payment } from "../../types";

export default function FinancePayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selected, setSelected] = useState<Payment | null>(null);
  const [loading, setLoading]   = useState(true);
  const [detail, setDetail]     = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

  const fetchPayments = () => {
    const url = statusFilter
      ? `/finance/payments?status=${statusFilter}`
      : "/finance/payments";
    api.get(url).then((r) => {
      setPayments(r.data.data || []);
      setLoading(false);
    });
  };

  useEffect(() => { fetchPayments(); }, [statusFilter]);

  const openDetail = async (id: number) => {
    const r = await api.get(`/finance/payments/${id}`);
    setSelected(r.data.data);
    setDetail(true);
  };

  const totalAmount = payments
    .filter((p) => p.status === "Success")
    .reduce((s, p) => s + p.amount_paid, 0);

  const filteredPayments = payments;

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <PageHeader
        title="All Payments"
        subtitle={`Total collected: ₹${totalAmount.toLocaleString()}`}
        actions={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-40"
          >
            <option value="">All Status</option>
            <option value="Success">Success</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
          </select>
        }
      />

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {["Receipt", "Student", "Fee", "Amount", "Status", "Date", "Action"]
                  .map((h) => (
                    <th key={h}
                      className="text-left px-4 py-3 text-xs font-semibold
                                 text-gray-500 uppercase">
                      {h}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{p.receipt_number}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(p.payment_date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {p.student?.first_name} {p.student?.last_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {p.student?.university_reg_no}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {p.invoice?.invoice_number}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="font-bold text-gray-900">₹{p.amount_paid?.toLocaleString()}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      p.status === "Success" ? "bg-green-100 text-green-700" :
                        p.status === "Pending" ? "bg-yellow-100 text-yellow-700" :
                          "bg-red-100 text-red-700"
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">
                    {p.gateway || p.payment_mode || "Manual"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {p.status === "Success" && (
                      <button
                        onClick={() => window.open(`/api/payments/${p.id}/receipt`, '_blank')}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Download Receipt"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={7}
                    className="px-4 py-12 text-center text-gray-400">
                    No payments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Detail Modal */}
      <Modal
        isOpen={detail}
        onClose={() => setDetail(false)}
        title="Payment Receipt"
        size="md"
      >
        {selected && (
          <div className="space-y-4">
            {/* Receipt Header */}
            <div className="text-center p-4 bg-gradient-to-r from-green-50
                            to-emerald-50 rounded-xl border border-green-200">
              <div className="w-14 h-14 bg-green-500 rounded-full flex
                              items-center justify-center mx-auto mb-3">
                <Download className="w-7 h-7 text-white" />
              </div>
              <p className="text-lg font-bold text-gray-900">
                Payment Receipt
              </p>
              <p className="font-mono text-primary-600 font-semibold text-sm">
                {selected.receipt_number}
              </p>
            </div>

            {/* Details */}
            <div className="space-y-3 text-sm">
              {[
                ["Student", selected.student?.first_name ? `${selected.student.first_name} ${selected.student.last_name}` : "—"],
                ["Enrollment", selected.student?.university_reg_no || "—"],
                ["Invoice Number", selected.invoice?.invoice_number || "—"],
                ["Invoice Date", selected.invoice?.invoice_date ? new Date(selected.invoice.invoice_date).toLocaleDateString() : "—"],
                ["Due Date", selected.invoice?.due_date ? new Date(selected.invoice.due_date).toLocaleDateString() : "—"],
                ["Amount", `₹${selected.amount_paid?.toLocaleString()}`],
                ["Currency", selected.currency],
                ["Status", selected.status.toUpperCase()],
                ["Method", selected.payment_mode || "—"],
                ["Razorpay ID", selected.razorpay_payment_id || "—"],
                ["Paid At", selected.payment_date
                  ? new Date(selected.payment_date).toLocaleString()
                  : "—"],
              ].map(([label, value]) => (
                <div key={label}
                  className="flex justify-between py-2 border-b
                             border-gray-100 last:border-0">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-semibold text-gray-900 text-right max-w-48
                                   truncate">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
}