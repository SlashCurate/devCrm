import React, { useEffect, useState } from "react";
import Layout from "../../components/shared/Layout";
import PageHeader from "../../components/shared/PageHeader";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import api from "../../api/axios";
import { IndianRupee, Calendar } from "lucide-react";
import type { StudentFeeInvoice } from "../../types";

export default function CollegeFees() {
  const [fees, setFees]       = useState<StudentFeeInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/college/fees").then((r) => {
      setFees(r.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  
  const grouped = fees.reduce((acc: Record<string, StudentFeeInvoice[]>, fee) => {
    const key = fee.student?.program?.name || fee.student?.university_reg_no || "General";
    if (!acc[key]) acc[key] = [];
    acc[key].push(fee);
    return acc;
  }, {});

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <PageHeader
        title="Fee Structures"
        subtitle="View fee structures for your college courses"
      />

      {Object.entries(grouped).map(([programName, programFees]) => (
        <div key={programName} className="mb-8">
          <h2 className="text-base font-bold text-gray-800 mb-4 flex
                         items-center gap-2">
            <span className="w-2 h-2 bg-primary-500 rounded-full" />
            {programName}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {programFees.map((fee) => (
              <div
                key={fee.id}
                className="card hover:shadow-md transition-shadow border-l-4
                           border-primary-400"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-green-100 rounded-xl">
                      <IndianRupee className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">
                        {fee.student?.first_name} {fee.student?.last_name}
                      </p>
                      <span className="badge-info text-xs capitalize">
                        {fee.invoice_number}
                      </span>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-green-600">
                    ₹{fee.net_amount.toLocaleString()}
                  </p>
                </div>

                <div className="text-xs text-gray-500 space-y-1 mt-3">
                  <p>Status: <span className={`font-medium ${
                    fee.status === 'Paid' ? 'text-green-600' :
                    fee.status === 'Overdue' ? 'text-red-600' :
                    fee.status === 'Partial' ? 'text-yellow-600' :
                    'text-gray-600'
                  }`}>{fee.status}</span></p>
                  {fee.due_date && (
                    <p className="flex items-center gap-1 text-red-500">
                      <Calendar className="w-3 h-3" />
                      Due: {new Date(fee.due_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {fees.length === 0 && (
        <div className="card text-center py-16">
          <IndianRupee className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No fee structures defined yet</p>
          <p className="text-gray-400 text-sm mt-1">
            Contact the Finance Controller to set up fees
          </p>
        </div>
      )}
    </Layout>
  );
}