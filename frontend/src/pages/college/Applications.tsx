import { useEffect, useState } from "react";
import Layout from "../../components/shared/Layout";
import PageHeader from "../../components/shared/PageHeader";
import Modal from "../../components/shared/Modal";
import StatusBadge from "../../components/shared/StatusBadge";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import api from "../../api/axios";
import { useForm } from "react-hook-form";
import { Eye, CheckCircle, GraduationCap } from "lucide-react";
import toast from "react-hot-toast";

/* ================= TYPES (FIXED FOR GO RESPONSE) ================= */
export interface Application {
  ID: number;

  FirstName: string;
  LastName: string;
  Email: string;
  Phone: string;
  Gender: string;


  PreviousSchool: string;

  Status: string;
  SubmittedAt?: string;

  Address?: string;
  City?: string;
  State?: string;
  Pincode?: string;

  Statement?: string;

  RejectionReason?: string;

  Program?: {
    Name: string;
  };

  College?: {
    name: string;
  };
}

export default function CollegeApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selected, setSelected] = useState<Application | null>(null);

  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

  const { register, handleSubmit, reset } = useForm();

  /* ================= FETCH ================= */
  const fetchApplications = async () => {
    const url = statusFilter
      ? `/college/applications?status=${statusFilter}`
      : "/college/applications";

    const r = await api.get(url);

    setApplications(r.data.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  /* ================= ACTIONS ================= */
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
      await api.put(`/college/applications/${selected.ID}/review`, data);
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

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  /* ================= UI ================= */
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
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="rejected">Rejected</option>
            <option value="enrolled">Admitted</option>
          </select>
        }
      />

      {/* ================= TABLE ================= */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {[
                  "Applicant",
                  "Program",
                  "College",
                  "Status",
                  "Submitted",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {applications.map((app) => (
                <tr key={app.ID} className="hover:bg-gray-50">

                  {/* Applicant */}
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">
                      {app.FirstName} {app.LastName}
                    </p>
                    <p className="text-xs text-gray-400">{app.Email}</p>
                  </td>

                  {/* Program */}
                  <td className="px-4 py-3 text-gray-500">
                    {app.Program?.Name || "—"}
                  </td>

                  {/* College */}
                  <td className="px-4 py-3 text-gray-500">
                    {app.College?.name || "—"}
                  </td>


                  {/* Status */}
                  <td className="px-4 py-3">
                    <StatusBadge status={app.Status} />
                  </td>

                  {/* Submitted */}
                  <td className="px-4 py-3 text-gray-500">
                    {app.SubmittedAt
                      ? new Date(app.SubmittedAt).toLocaleDateString()
                      : "—"}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">

                      <button
                        onClick={() => openDetail(app)}
                        className="text-gray-400 hover:text-blue-600"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {(app.Status === "submitted" ||
                        app.Status === "under_review") && (
                        <button
                          onClick={() => openReview(app)}
                          className="text-green-500"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}

                      {app.Status === "shortlisted" && (
                        <button
                          onClick={() => enrollStudent(app.ID)}
                          className="text-blue-500"
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
                  <td colSpan={7} className="text-center py-10 text-gray-400">
                    No applications found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= DETAIL MODAL ================= */}
      <Modal
        isOpen={detailModal}
        onClose={() => setDetailModal(false)}
        title="Application Details"
        size="lg"
      >
        {selected && (
          <div className="space-y-3 text-sm">

            <p>
              <b>Name:</b> {selected.FirstName} {selected.LastName}
            </p>

            <p><b>Email:</b> {selected.Email}</p>
            <p><b>Phone:</b> {selected.Phone}</p>
            <p><b>Program:</b> {selected.Program?.Name}</p>
            <p><b>College:</b> {selected.College?.name}</p>


            <p>
              <b>Status:</b> <StatusBadge status={selected.Status} />
            </p>

            <p>
              <b>Address:</b>{" "}
              {selected.Address}, {selected.City}, {selected.State} -{" "}
              {selected.Pincode}
            </p>

            {selected.Statement && (
              <p className="bg-gray-50 p-3 rounded">
                {selected.Statement}
              </p>
            )}

            {selected.RejectionReason && (
              <p className="bg-red-50 p-3 rounded text-red-600">
                {selected.RejectionReason}
              </p>
            )}

          </div>
        )}
      </Modal>

      {/* REVIEW MODAL (unchanged logic) */}
      <Modal
        isOpen={reviewModal}
        onClose={() => setReviewModal(false)}
        title="Review Application"
      >
        <form onSubmit={handleSubmit(onReview)} className="space-y-3">

          <select {...register("status")} className="input-field">
            <option value="under_review">Under Review</option>
            <option value="shortlisted">Shortlist</option>
            <option value="rejected">Reject</option>
          </select>

          <textarea
            {...register("rejection_reason")}
            className="input-field"
            placeholder="Reason (if rejected)"
          />

          <button className="btn-primary w-full">
            Submit
          </button>

        </form>
      </Modal>

    </Layout>
  );
}