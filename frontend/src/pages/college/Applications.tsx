import React, { useEffect, useState } from "react";
import Layout from "../../components/shared/Layout";
import PageHeader from "../../components/shared/PageHeader";
import Modal from "../../components/shared/Modal";
import StatusBadge from "../../components/shared/StatusBadge";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import api from "../../api/axios";
import { useForm } from "react-hook-form";
import { Eye, CheckCircle, XCircle, GraduationCap } from "lucide-react";
import toast from "react-hot-toast";
import { Application } from "../../types";

export default function CollegeApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selected, setSelected]         = useState<Application | null>(null);
  const [loading, setLoading]           = useState(true);
  const [reviewModal, setReviewModal]   = useState(false);
  const [detailModal, setDetailModal]   = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const { register, handleSubmit, reset } = useForm();

  const fetchApplications = async () => {
    const url = statusFilter
      ? `/college/applications?status=${statusFilter}`
      : "/college/applications";
    const r = await api.get(url);
    setApplications(r.data.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchApplications(); }, [statusFilter]);

  const openReview = (app: Application) => {
    setSelected(app);
    setReviewModal(true);
  };

  const openDetail = (app: Application) => {
    setSelected(app);
    setDetailModal(true);
  };

  const onReview = async (data: any) => {
    if (!selected) return;
    try {
      await api.put(`/college/applications/${selected.id}/review`, data);
      toast.success("Application reviewed!");
      reset();
      setReviewModal(false);
      fetchApplications();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed");
    }
  };

  const enrollStudent = async (id: number) => {
    try {
      const r = await api.put(`/college/applications/${id}/enroll`);
      toast.success(
        `Student enrolled! Number: ${r.data.data.university_reg_no}`
      );
      fetchApplications();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to enroll");
    }
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <PageHeader
        title="Applications"
        subtitle="Review and manage student applications"
        actions={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-40"
          >
            <option value="">All Status</option>
            <option value="Submitted">Submitted</option>
            <option value="UnderReview">Under Review</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Rejected">Rejected</option>
            <option value="Admitted">Admitted</option>
          </select>
        }
      />

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {["Applicant","Program","College","Grade","Status",
                  "Submitted","Actions"].map((h) => (
                  <th key={h}
                    className="text-left px-4 py-3 text-xs font-semibold
                               text-gray-500 uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {applications.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">
                        {app.first_name} {app.last_name}
                      </p>
                      <p className="text-xs text-gray-400">{app.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {app.program?.name}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {app.college?.name}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {app.previous_grade}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {app.submitted_at
                      ? new Date(app.submitted_at).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openDetail(app)}
                        className="p-1.5 text-gray-400 hover:text-primary-600
                                   hover:bg-primary-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {app.status === "Submitted" ||
                        app.status === "UnderReview" ? (
                        <button
                          onClick={() => openReview(app)}
                          className="p-1.5 text-gray-400 hover:text-green-600
                                     hover:bg-green-50 rounded-lg transition-colors"
                          title="Review"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      ) : null}
                      {app.status === "Shortlisted" && (
                        <button
                          onClick={() => enrollStudent(app.id)}
                          className="p-1.5 text-gray-400 hover:text-blue-600
                                     hover:bg-blue-50 rounded-lg transition-colors"
                          title="Enroll"
                        >
                          <GraduationCap className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {applications.length === 0 && (
                <tr>
                  <td colSpan={7}
                    className="px-4 py-12 text-center text-gray-400">
                    No applications found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      <Modal
        isOpen={reviewModal}
        onClose={() => setReviewModal(false)}
        title="Review Application"
      >
        <form onSubmit={handleSubmit(onReview)} className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="font-semibold text-gray-900">
              {selected?.first_name} {selected?.last_name}
            </p>
            <p className="text-sm text-gray-500">
              {selected?.program?.name} — Grade: {selected?.previous_grade}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Decision
            </label>
            <select
              {...register("status", { required: "Required" })}
              className="input-field"
            >
              <option value="">Select Decision</option>
              <option value="under_review">Mark as Under Review</option>
              <option value="shortlisted">Shortlist ✅</option>
              <option value="rejected">Reject ❌</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rejection Reason (if rejected)
            </label>
            <textarea
              {...register("rejection_reason")}
              className="input-field"
              rows={3}
              placeholder="Reason for rejection..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">
              Submit Review
            </button>
            <button
              type="button"
              onClick={() => setReviewModal(false)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={detailModal}
        onClose={() => setDetailModal(false)}
        title="Application Details"
        size="lg"
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500">Full Name</p>
                <p className="font-semibold">
                  {selected.first_name} {selected.last_name}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-semibold">{selected.email}</p>
              </div>
              <div>
                <p className="text-gray-500">Phone</p>
                <p className="font-semibold">{selected.phone}</p>
              </div>
              <div>
                <p className="text-gray-500">Gender</p>
                <p className="font-semibold">{selected.gender}</p>
              </div>
              <div>
                <p className="text-gray-500">Course Applied</p>
                <p className="font-semibold">{selected.program?.name}</p>
              </div>
              <div>
                <p className="text-gray-500">Previous Grade</p>
                <p className="font-semibold">{selected.previous_grade}</p>
              </div>
              <div>
                <p className="text-gray-500">Previous School</p>
                <p className="font-semibold">{selected.previous_school}</p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <StatusBadge status={selected.status} />
              </div>
            </div>

            <div>
              <p className="text-gray-500 mb-1">Address</p>
              <p className="font-semibold">
                {selected.address}, {selected.city},
                {selected.state} - {selected.pincode}
              </p>
            </div>

            {selected.statement_of_purpose && (
              <div>
                <p className="text-gray-500 mb-1">Personal Statement</p>
                <p className="bg-gray-50 p-3 rounded-lg text-gray-700">
                  {selected.statement_of_purpose}
                </p>
              </div>
            )}

            {selected.rejection_reason && (
              <div>
                <p className="text-gray-500 mb-1">Rejection Reason</p>
                <p className="bg-red-50 p-3 rounded-lg text-red-700">
                  {selected.rejection_reason}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </Layout>
  );
}