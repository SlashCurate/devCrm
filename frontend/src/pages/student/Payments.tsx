import React, { useEffect, useState } from "react";
import Layout from "../../components/shared/Layout";
import PageHeader from "../../components/shared/PageHeader";
import StatusBadge from "../../components/shared/StatusBadge";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { CreditCard, Clock, Receipt } from "lucide-react";
import { Payment, FeeStructure } from "../../types";

declare global {
  interface Window { Razorpay: any; }
}

export default function StudentPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pending, setPending]   = useState<FeeStructure[]>([]);
  const [loading, setLoading]   = useState(true);
  const [paying, setPaying]     = useState<number | null>(null);

  // ================= FETCH DATA =================
  const fetchAll = async () => {
    try {
      setLoading(true);
      const [pay, pend] = await Promise.all([
        api.get("/student/payments"),
        api.get("/student/payments/pending"),
      ]);

      setPayments(pay.data.data || []);
      setPending(pend.data.data || []);
    } catch (err: any) {
      toast.error("Failed to load payments");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // ================= LOAD RAZORPAY =================
  const loadRazorpayScript = (): Promise<boolean> =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);

      document.body.appendChild(script);
    });

  // ================= HANDLE PAYMENT =================
  const handlePay = async (fee: FeeStructure) => {
    if (paying) return; // prevent multiple clicks

    setPaying(fee.id);

    try {
      // 1. Load Razorpay
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error("Razorpay SDK failed to load");
        return;
      }

      if (!window.Razorpay) {
        toast.error("Razorpay not available");
        return;
      }

      // 2. Create order
      const orderRes = await api.post("/student/payments/order", {
        fee_structure_id: fee.id,
      });

      const { order_id, amount, currency, key_id, fee_name } =
        orderRes.data.data;

      console.log("Order created:", orderRes.data.data);

      // 3. Configure Razorpay
      const options = {
        key: key_id,
        amount,
        currency,
        name: "University ERP",
        description: fee_name,
        order_id,

        handler: async (response: any) => {
          console.log("Payment success:", response);

          try {
            await api.post("/student/payments/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            toast.success("Payment successful 🎉");
            fetchAll();
          } catch (err) {
            console.error(err);
            toast.error("Verification failed");
          }
        },

        modal: {
          ondismiss: async () => {
            console.log("Payment dismissed");

            await api.post("/student/payments/failure", {
              razorpay_order_id: order_id,
              failure_reason: "User closed payment popup",
            });
          },
        },

        prefill: {
          name: "",
          email: "",
          contact: "",
        },

        theme: {
          color: "#2563eb",
        },
      };

      // 4. Open Razorpay
      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", async (resp: any) => {
        console.error("Payment failed:", resp);

        await api.post("/student/payments/failure", {
          razorpay_order_id: order_id,
          failure_reason: resp.error.description,
        });

        toast.error("Payment failed: " + resp.error.description);
      });

      rzp.open();

    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Payment failed to start");
    } finally {
      setPaying(null);
    }
  };

  // ================= UI =================
  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <PageHeader title="Payments" subtitle="Manage your fee payments" />

      {/* Pending Fees */}
      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            Pending Fees ({pending.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {pending.map((fee) => (
              <div key={fee.id} className="card border-2 border-yellow-200 hover:border-yellow-400">

                <div className="flex justify-between mb-3">
                  <div>
                    <p className="font-bold">{fee.category?.name || 'Fee'}</p>
                    <span className="badge-warning text-xs">{fee.category?.name || 'General'}</span>
                  </div>

                  <p className="text-2xl font-bold text-green-600">
                    ₹{fee.amount.toLocaleString()}
                  </p>
                </div>

                <div className="text-sm text-gray-500 mb-4">
                  <p>Academic Year: {fee.academic_year?.name || 'N/A'}</p>
                  {fee.due_date && (
                    <p className="text-red-500">
                      Due: {new Date(fee.due_date).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handlePay(fee)}
                  disabled={paying === fee.id}
                  className="btn-primary w-full flex justify-center gap-2"
                >
                  {paying === fee.id ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                  ) : (
                    <CreditCard className="w-4 h-4" />
                  )}
                  {paying === fee.id ? "Processing..." : `Pay ₹${fee.amount.toLocaleString()}`}
                </button>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment History */}
      <div className="card">
        <h2 className="text-lg font-bold mb-4 flex gap-2 items-center">
          <Receipt className="w-5 h-5 text-primary-500" />
          Payment History
        </h2>

        {payments.length === 0 ? (
          <p className="text-gray-400 text-center py-10">No payments yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {["Receipt","Fee","Amount","Method","Status","Date"].map(h => (
                  <th key={h} className="px-4 py-2 text-left">{h}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {payments.map(p => (
                <tr key={p.id}>
                  <td className="px-4 py-2">{p.receipt_number}</td>
                  <td className="px-4 py-2">{p.invoice?.invoice_number || 'N/A'}</td>
                  <td className="px-4 py-2 text-green-600">₹{p.amount_paid}</td>
                  <td className="px-4 py-2">{p.payment_mode}</td>
                  <td className="px-4 py-2"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-2">
                    {p.payment_date ? new Date(p.payment_date).toLocaleDateString() : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}