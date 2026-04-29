import React, { useEffect, useState } from "react";
import Layout from "../../components/shared/Layout";
import PageHeader from "../../components/shared/PageHeader";
import StatusBadge from "../../components/shared/StatusBadge";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import Modal from "../../components/shared/Modal";
import api from "../../api/axios";
import { Eye, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Application } from "../../types";

const statusSteps = [
  "Draft",
  "Submitted",
  "UnderReview",
  "Shortlisted",
  "Admitted",
];

export default function MyApplications() {
  const navigate = useNavigate();
  const [apps, setApps] = useState<Application[]>([]);
  const [selected, setSelected] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(false);

  useEffect(() => {
    api
      .get("/student/applications")
      .then((r) => {
        setApps(r.data.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Layout>
      <LoadingSpinner />
    </Layout>
  );

  return (
    <Layout>
      <PageHeader
        title="My Applications"
        subtitle="Track all your admission applications"
        actions={
          <button
            onClick={() => navigate("/student/apply")}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New Application
          </button>
        }
      />

      {apps.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-gray-500 font-medium mb-3">
            No applications yet
          </p>
          <button
            onClick={() => navigate("/student/apply")}
            className="btn-primary"
          >
            Apply Now →
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {apps.map((app) => {
            const currentStep = statusSteps.indexOf(app.status);

            return (
              <div
                key={app.id}
                className="card hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      {app.program?.name}
                    </h3>
                    <p className="text-gray-500 text-sm">
                      {app.college?.name}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      Applied:{" "}
                      {app.submitted_at
                        ? new Date(app.submitted_at).toLocaleDateString()
                        : "—"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status={app.status} />
                    <button
                      onClick={() => {
                        setSelected(app);
                        setDetail(true);
                      }}
                      className="p-1.5 text-gray-400 hover:text-primary-600
                                 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Tracker */}
                <div className="relative">
                  <div className="flex items-center justify-between relative">
                    <div className="absolute left-0 right-0 top-4 h-0.5 bg-gray-200 z-0" />

                    <div
                      className="absolute left-0 top-4 h-0.5 bg-primary-500 z-0 transition-all duration-500"
                      style={{
                        width:
                          currentStep < 0
                            ? 0
                            : (currentStep / (statusSteps.length - 1)) * 100 + "%",
                      }}
                    />

                    {statusSteps.map((s, i) => {
                      const done = i < currentStep;
                      const active = i === currentStep;
                      const reject = app.status === "Rejected";

                      return (
                        <div
                          key={s}
                          className="flex flex-col items-center z-10 flex-1"
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                              reject && i === currentStep
                                ? "bg-red-500 border-red-500 text-white"
                                : done
                                ? "bg-primary-600 border-primary-600 text-white"
                                : active
                                ? "bg-white border-primary-500 text-primary-600 ring-4 ring-primary-100"
                                : "bg-white border-gray-300 text-gray-300"
                            }`}
                          >
                            {done ? "✓" : i + 1}
                          </div>

                          <span
                            className={`text-xs mt-1.5 text-center leading-tight hidden sm:block ${
                              active
                                ? "text-primary-600 font-semibold"
                                : done
                                ? "text-primary-400"
                                : "text-gray-300"
                            }`}
                          >
                            {s.replace(/_/g, " ")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Rejection reason */}
                {app.status === "Rejected" && app.rejection_reason && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-red-600 text-sm">
                      <span className="font-semibold">Reason: </span>
                      {app.rejection_reason}
                    </p>
                  </div>
                )}

                {/* Admitted */}
                {app.status === "Admitted" && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
                    <span className="text-green-600 text-xl">🎓</span>
                    <div>
                      <p className="text-green-700 text-sm font-semibold">
                        Admitted Successfully!
                      </p>
                      <p className="text-green-600 text-xs">
                        Check your dashboard for your enrollment number.
                      </p>
                    </div>
                  </div>
                )}

                {/* Shortlisted */}
                {app.status === "Shortlisted" && (
                  <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center gap-2">
                    <span className="text-purple-600 text-xl">🎉</span>
                    <div>
                      <p className="text-purple-700 text-sm font-semibold">
                        Shortlisted!
                      </p>
                      <p className="text-purple-600 text-xs">
                        Please visit the college with your original documents.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={detail}
        onClose={() => setDetail(false)}
        title="Application Details"
        size="lg"
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-lg text-gray-900">
                  {selected.program?.name}
                </p>
                <p className="text-gray-500">{selected.college?.name}</p>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                ["Name", `${selected.first_name} ${selected.last_name}`],
                ["Email", selected.email],
                ["Phone", selected.phone],
                ["Gender", selected.gender],
                ["Prev. School", selected.previous_school],
                ["Prev. Grade", selected.previous_grade],
                ["City / State", `${selected.city}, ${selected.state}`],
                ["Pin Code", selected.pincode],
              ].map(([label, value]: any) => (
                <div key={label} className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-gray-400 text-xs">{label}</p>
                  <p className="font-semibold text-gray-900 mt-0.5">
                    {value || "—"}
                  </p>
                </div>
              ))}
            </div>

            {selected.statement_of_purpose && (
              <div>
                <p className="text-gray-400 text-xs mb-1">
                  Personal Statement
                </p>
                <p className="bg-gray-50 p-3 rounded-xl text-gray-700 leading-relaxed">
                  {selected.statement_of_purpose}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </Layout>
  );
}