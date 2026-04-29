import React, { useEffect, useState } from "react";
import Layout from "../../components/shared/Layout";
import PageHeader from "../../components/shared/PageHeader";
import Modal from "../../components/shared/Modal";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import api from "../../api/axios";
import { useForm } from "react-hook-form";
import { Plus, Send, Eye } from "lucide-react";
import toast from "react-hot-toast";
import { Exam, Result } from "../../types";

export default function Results() {
  const [exams, setExams]         = useState<Exam[]>([]);
  const [results, setResults]     = useState<Result[]>([]);
  const [selectedExam, setSelectedExam] = useState<number | null>(null);
  const [loading, setLoading]     = useState(true);
  const [addModal, setAddModal]   = useState(false);
  const { register, handleSubmit, reset } = useForm();

  const fetchExams = async () => {
    const r = await api.get("/registrar/exams");
    setExams(r.data.data || []);
    setLoading(false);
  };

  const fetchResults = async (examId: number) => {
    const r = await api.get(`/registrar/results/${examId}`);
    setResults(r.data.data || []);
  };

  useEffect(() => { fetchExams(); }, []);

  useEffect(() => {
    if (selectedExam) fetchResults(selectedExam);
  }, [selectedExam]);

  const onAddResult = async (data: any) => {
    try {
      await api.post("/registrar/results", {
        exam_id:        Number(data.exam_id),
        student_id:     Number(data.student_id),
        marks_obtained: Number(data.marks_obtained),
        remarks:        data.remarks,
      });
      toast.success("Result saved!");
      reset();
      setAddModal(false);
      if (selectedExam) fetchResults(selectedExam);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed");
    }
  };

  const publishResults = async (examId: number) => {
    try {
      await api.put(`/registrar/results/${examId}/publish`);
      toast.success("Results published! Students notified.");
      if (selectedExam) fetchResults(selectedExam);
    } catch {
      toast.error("Failed to publish results");
    }
  };

  const gradeColor: Record<string, string> = {
    "A+": "text-green-600 font-bold",
    "A":  "text-green-500 font-bold",
    "B+": "text-blue-600 font-bold",
    "B":  "text-blue-500 font-bold",
    "C":  "text-yellow-600 font-bold",
    "D":  "text-orange-500 font-bold",
    "F":  "text-red-600 font-bold",
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <PageHeader
        title="Results"
        subtitle="Manage and publish exam results"
        actions={
          <button
            onClick={() => setAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Result
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exam List */}
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">Select Exam</h3>
          <div className="space-y-2">
            {exams.map((e) => (
              <button
                key={e.id}
                onClick={() => setSelectedExam(e.id)}
                className={`w-full text-left p-3 rounded-lg border
                            transition-all duration-200 ${
                  selectedExam === e.id
                    ? "border-primary-500 bg-primary-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <p className="font-medium text-sm text-gray-900">{e.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {e.program?.name} • Sem {e.semester?.semester_number || e.semester_id}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {e.exam_date ? new Date(e.exam_date).toLocaleDateString() : 'N/A'}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Results Table */}
        <div className="lg:col-span-2 card">
          {selectedExam ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">
                  Results ({results.length})
                </h3>
                <button
                  onClick={() => publishResults(selectedExam)}
                  className="btn-primary text-sm flex items-center gap-2"
                >
                  <Send className="w-3 h-3" /> Publish All
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      {["Student","Marks","Grade","Status","Remarks"].map(
                        (h) => (
                          <th key={h}
                            className="text-left px-3 py-2 text-xs font-semibold
                                       text-gray-500 uppercase">
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {results.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium">
                          {r.student?.first_name ? `${r.student.first_name} ${r.student.last_name}` : `Student #${r.student_id}`}
                        </td>
                        <td className="px-3 py-2">{r.marks_obtained}</td>
                        <td className={`px-3 py-2 ${r.grade ? gradeColor[r.grade] || "" : ""}`}>
                          {r.grade}
                        </td>
                        <td className="px-3 py-2">
                          <span className={r.is_published
                            ? "badge-success" : "badge-warning"}>
                            {r.is_published ? "Published" : "Draft"}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-500">
                          {r.remarks || "—"}
                        </td>
                      </tr>
                    ))}
                    {results.length === 0 && (
                      <tr>
                        <td colSpan={5}
                          className="px-3 py-8 text-center text-gray-400">
                          No results yet for this exam
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400">
              <div className="text-center">
                <Eye className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>Select an exam to view results</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Result Modal */}
      <Modal
        isOpen={addModal}
        onClose={() => setAddModal(false)}
        title="Add Result"
      >
        <form onSubmit={handleSubmit(onAddResult)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Exam
            </label>
            <select
              {...register("exam_id", { required: "Required" })}
              className="input-field"
            >
              <option value="">Select Exam</option>
              {exams.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Student ID
            </label>
            <input
              {...register("student_id", { required: "Required" })}
              type="number"
              className="input-field"
              placeholder="Enter student ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Marks Obtained
            </label>
            <input
              {...register("marks_obtained", { required: "Required" })}
              type="number"
              step="0.5"
              className="input-field"
              placeholder="85"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Remarks
            </label>
            <input
              {...register("remarks")}
              className="input-field"
              placeholder="Excellent performance"
            />
          </div>

          <p className="text-xs text-gray-400">
            💡 Grade will be auto-calculated based on marks percentage
          </p>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">
              Save Result
            </button>
            <button
              type="button"
              onClick={() => setAddModal(false)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}