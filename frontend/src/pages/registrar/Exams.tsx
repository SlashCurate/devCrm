import React, { useEffect, useState } from "react";
import Layout from "../../components/shared/Layout";
import PageHeader from "../../components/shared/PageHeader";
import Modal from "../../components/shared/Modal";
import StatusBadge from "../../components/shared/StatusBadge";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import api from "../../api/axios";
import { useForm } from "react-hook-form";
import { Plus, Send, Edit } from "lucide-react";
import toast from "react-hot-toast";
import type { Exam, College, Program, Subject } from "../../types";

export default function Exams() {
  const [exams, setExams]       = useState<Exam[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [programs, setPrograms]   = useState<Program[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const { register, handleSubmit, reset, watch } = useForm();

  const selectedCollege = watch("college_id");
  const selectedProgram = watch("course_id");
  const filteredPrograms = programs.filter(
    (p) => p.college_id === Number(selectedCollege)
  );
  const filteredSubjects = subjects.filter(
    (s) => s.program_id === Number(selectedProgram)
  );

  const fetchAll = async () => {
    try {
      const [e, cl, co, su, ay, sem] = await Promise.all([
        api.get("/registrar/exams"),
        api.get("/colleges"),
        api.get("/courses"),
        api.get("/registrar/subjects"),
        api.get("/academic-years"),
        api.get("/semesters"),
      ]);
      setExams(e.data.data || []);
      setColleges(cl.data.data || []);
      setPrograms(co.data.data || []);
      setSubjects(su.data.data || []);
      setAcademicYears(ay.data.data || []);
      setSemesters(sem.data.data || []);
    } catch (err) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const onSubmit = async (data: any) => {
    try {
      await api.post("/registrar/exams", {
        ...data,
        college_id: Number(data.college_id),
        program_id: Number(data.course_id),
        subject_id: data.subject_id ? Number(data.subject_id) : undefined,
        duration: Number(data.duration),
        total_marks: Number(data.max_marks), // backend uses total_marks
        passing_marks: Number(data.pass_marks), // backend uses passing_marks
        semester_id: Number(data.semester_id),
        academic_year_id: Number(data.academic_year_id),
        exam_date: new Date(data.exam_date).toISOString(),
      });
      toast.success("Exam created!");
      reset(); setModal(false); fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed");
    }
  };

  const publishExam = async (id: number) => {
    try {
      await api.put(`/registrar/exams/${id}/publish`);
      toast.success("Exam published! Students notified.");
      fetchAll();
    } catch {
      toast.error("Failed to publish");
    }
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <PageHeader
        title="Exams"
        subtitle="Schedule and publish examinations"
        actions={
          <button
            onClick={() => setModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create Exam
          </button>
        }
      />

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {["Exam Name", "Program", "College", "Date", "Marks",
                  "Semester", "Status", "Actions"].map((h) => (
                  <th key={h}
                    className="text-left px-4 py-3 text-xs font-semibold
                               text-gray-500 uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {exams.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {e.name}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {e.program?.name}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {e.college_id ? colleges.find(c => c.id === e.college_id)?.name : '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {e.exam_date ? new Date(e.exam_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {e.max_marks} / Pass: {e.pass_marks}
                  </td>
                  <td className="px-4 py-3 text-gray-500">Sem {typeof e.semester === 'object' ? e.semester?.semester_number : e.semester}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={e.is_published ? "success" : "pending"} />
                  </td>
                  <td className="px-4 py-3">
                    {!e.is_published && (
                      <button
                        onClick={() => publishExam(e.id)}
                        className="flex items-center gap-1 text-xs
                                   text-primary-600 hover:text-primary-700
                                   font-medium"
                      >
                        <Send className="w-3 h-3" /> Publish
                      </button>
                    )}
                    {e.is_published && (
                      <span className="text-xs text-gray-400">Published</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Create Exam" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Exam Name
            </label>
            <input
              {...register("name", { required: "Required" })}
              className="input-field"
              placeholder="Mid Semester Exam - Computer Science"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                College
              </label>
              <select
                {...register("college_id", { required: "Required" })}
                className="input-field"
              >
                <option value="">Select College</option>
                {colleges.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course
              </label>
              <select
                {...register("course_id", { required: "Required" })}
                className="input-field"
              >
                <option value="">Select Program</option>
                {filteredPrograms.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject (Optional)
            </label>
            <select
              {...register("subject_id")}
              className="input-field"
              disabled={!selectedProgram}
            >
              <option value="">{selectedProgram ? "Select Subject" : "Select Program First"}</option>
              {filteredSubjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Exam Date
              </label>
              <input
                {...register("exam_date", { required: "Required" })}
                type="datetime-local"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (minutes)
              </label>
              <input
                {...register("duration", { required: "Required" })}
                type="number"
                className="input-field"
                placeholder="180"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Marks
              </label>
              <input
                {...register("max_marks", { required: "Required" })}
                type="number"
                className="input-field"
                placeholder="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Passing Marks
              </label>
              <input
                {...register("pass_marks", { required: "Required" })}
                type="number"
                className="input-field"
                placeholder="40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Semester
              </label>
              <select
                {...register("semester_id", { required: "Required" })}
                className="input-field"
              >
                <option value="">Select Semester</option>
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>Sem {s.semester_number} ({s.academic_year?.name})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Academic Year
              </label>
              <select
                {...register("academic_year_id", { required: "Required" })}
                className="input-field"
              >
                <option value="">Select Year</option>
                {academicYears.map((ay) => (
                  <option key={ay.id} value={ay.id}>{ay.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              {...register("description")}
              className="input-field"
              rows={2}
              placeholder="Exam description..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">
              Create Exam
            </button>
            <button
              type="button"
              onClick={() => setModal(false)}
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