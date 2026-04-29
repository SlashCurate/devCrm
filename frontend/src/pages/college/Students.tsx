import React, { useEffect, useState } from "react";
import Layout from "../../components/shared/Layout";
import PageHeader from "../../components/shared/PageHeader";
import Modal from "../../components/shared/Modal";
import StatusBadge from "../../components/shared/StatusBadge";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import api from "../../api/axios";
import { useForm } from "react-hook-form";
import { Plus, Eye } from "lucide-react";
import toast from "react-hot-toast";
import type { Student, Program } from "../../types";

export default function CollegeStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [programs, setPrograms]   = useState<Program[]>([]);
  const [selected, setSelected] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  const fetchAll = async () => {
    const [s, p] = await Promise.all([
      api.get("/college/students"),
      api.get("/college/programs"),
    ]);
    setStudents(s.data.data || []);
    setPrograms(p.data.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const onAdd = async (data: any) => {
    try {
      await api.post("/college/students", {
        ...data,
        program_id: Number(data.program_id),
      });
      toast.success("Student added!");
      reset(); setAddModal(false); fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed");
    }
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <PageHeader
        title="Students"
        subtitle="Manage students in your college"
        actions={
          <button
            onClick={() => setAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Student
          </button>
        }
      />

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {["Student", "Program", "Enrollment No", "Status", "Actions"].map(
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
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">
                        {s.first_name} {s.last_name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {s.user?.email}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {s.program?.name || "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    {s.university_reg_no || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => { setSelected(s); setViewModal(true); }}
                      className="p-1.5 text-gray-400 hover:text-primary-600
                                 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      <Modal
        isOpen={addModal}
        onClose={() => setAddModal(false)}
        title="Add Student Manually"
        size="lg"
      >
        <form onSubmit={handleSubmit(onAdd)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                {...register("first_name", { required: true })}
                className="input-field" placeholder="John"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                {...register("last_name", { required: true })}
                className="input-field" placeholder="Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                {...register("username", { required: true })}
                className="input-field"
                placeholder="john_doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                {...register("email", { required: true })}
                type="email"
                className="input-field"
                placeholder="john@student.edu"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                {...register("phone")}
                className="input-field"
                placeholder="9876543210"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                {...register("password", { required: true })}
                type="password"
                className="input-field"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Previous School
              </label>
              <input
                {...register("previous_school")}
                className="input-field"
                placeholder="City High School"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Previous %
              </label>
              <input
                {...register("previous_percentage")}
                className="input-field"
                placeholder="85%"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Program
            </label>
            <select
              {...register("program_id", { required: true })}
              className="input-field"
            >
              <option value="">Select Program</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">
              Add Student
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

      {/* View Student Modal */}
      <Modal
        isOpen={viewModal}
        onClose={() => setViewModal(false)}
        title="Student Details"
        size="lg"
      >
        {selected && (
          <div className="space-y-4 text-sm">
            {/* Header */}
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r
                            from-primary-50 to-blue-50 rounded-xl">
              <div className="w-14 h-14 bg-primary-600 rounded-full flex
                              items-center justify-center text-white text-xl
                              font-bold">
                {selected.first_name?.[0]}{selected.last_name?.[0]}
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">
                  {selected.first_name} {selected.last_name}
                </p>
                <p className="text-gray-500">{selected.user?.email}</p>
                {selected.university_reg_no && (
                  <p className="font-mono text-primary-600 font-semibold">
                    {selected.university_reg_no}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                ["Phone",           selected.phone       || "—"],
                ["Gender",          selected.gender      || "—"],
                ["Course",          selected.program?.name || "—"],
                ["Status",          selected.is_active ? "Active" : "Inactive"],
                ["Previous School", selected.previous_school || "—"],
                ["Previous %",  selected.previous_percentage  || "—"],
                ["City",            selected.city        || "—"],
                ["State",           selected.state       || "—"],
              ].map(([label, value]) => (
                <div key={label} className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-gray-400 text-xs">{label}</p>
                  <p className="font-semibold text-gray-900 mt-0.5">{value}</p>
                </div>
              ))}
            </div>

            {selected.address && (
              <div className="bg-gray-50 p-3 rounded-xl">
                <p className="text-gray-400 text-xs">Address</p>
                <p className="font-semibold text-gray-900 mt-0.5">
                  {selected.address}, {selected.city},
                  {selected.state} - {selected.pincode}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </Layout>
  );
}