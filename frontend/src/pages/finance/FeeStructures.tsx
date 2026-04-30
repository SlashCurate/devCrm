import React, { useEffect, useState } from "react";
import Layout from "../../components/shared/Layout";
import PageHeader from "../../components/shared/PageHeader";
import Modal from "../../components/shared/Modal";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import api from "../../api/axios";
import { useForm } from "react-hook-form";
import { Plus, Trash2, IndianRupee, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import type { FeeStructure, College, Program } from "../../types";

export default function FeeStructures() {
  const [fees, setFees] = useState<FeeStructure[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editingFee, setEditingFee] = useState<FeeStructure | null>(null);

  const { register, handleSubmit, reset, watch, setValue } = useForm();

  const selectedCollege = watch("college_id");

  const filteredCourses = programs.filter(
    (c) => c.college_id === Number(selectedCollege)
  );

  const fetchAll = async () => {
    try {
      const [f, cl, co, ay, cat] = await Promise.all([
        api.get("/finance/fees"),
        api.get("/colleges"),
        api.get("/courses"),
        api.get("/academic-years"),
        api.get("/fee-categories"),
      ]);
      setFees(f.data?.data || []);
      setColleges(cl.data?.data || []);
      setPrograms(co.data?.data || []);
      setAcademicYears(ay.data?.data || []);
      setCategories(cat.data?.data || []);
    } catch (err) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const onSubmit = async (data: any) => {
    try {
      const payload = {
        ...data,
        program_id: Number(data.program_id),
        academic_year_id: Number(data.academic_year_id),
        category_id: Number(data.category_id),
        amount: Number(data.amount),
        semester_number: Number(data.semester_number),
      };

      if (editingFee) {
        await api.put(`/finance/fees/${editingFee.id}`, payload);
        toast.success("Fee updated!");
      } else {
        await api.post("/finance/fees", payload);
        toast.success("Fee structure created!");
      }

      reset();
      setModal(false);
      setEditingFee(null);
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed");
    }
  };

  const deleteFee = async (id: number) => {
    try {
      await api.delete(`/finance/fees/${id}`);
      toast.success("Fee structure deactivated");
      fetchAll();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleEdit = (f: FeeStructure) => {
    setEditingFee(f);
    setValue("category_id", f.category_id);
    setValue("amount", f.amount);
    setValue("college_id", f.program?.college_id);
    setValue("program_id", f.program_id);
    setValue("academic_year_id", f.academic_year_id);
    setValue("due_date", f.due_date);
    setValue("late_fine_per_day", f.late_fine_per_day);
    setModal(true);
  };

  if (loading)
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );

  return (
    <Layout>
      <PageHeader
        title="Fee Structures"
        subtitle="Create and manage fee plans for courses"
        actions={
          <button
            onClick={() => {
              setEditingFee(null);
              reset();
              setModal(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create Fee
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {fees.map((f) => (
          <div key={f.id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-xl">
                  <IndianRupee className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">
                    {f.category?.name || 'Fee'}
                  </h3>
                  <span className="badge-info text-xs">{f.category?.name || 'General'}</span>
                </div>
              </div>

              <div className="flex gap-2">
                {/* Edit */}
                <button
                  onClick={() => handleEdit(f)}
                  className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>

                {/* Delete */}
                <button
                  onClick={() => deleteFee(f.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Amount</span>
                <span className="font-bold text-green-600 text-base">
                  ₹{f.amount?.toLocaleString() || '0'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>College</span>
                <span className="font-medium">
                  {f.program?.college?.name || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Course</span>
                <span className="font-medium">
                  {f.program?.name || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Academic Year</span>
                <span>{f.academic_year?.name || 'N/A'}</span>
              </div>
              {f.due_date && (
                <div className="flex justify-between">
                  <span>Due Date</span>
                  <span className="text-red-500">
                    {new Date(f.due_date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={modal}
        onClose={() => {
          setModal(false);
          setEditingFee(null);
          reset();
        }}
        title={editingFee ? "Edit Fee Structure" : "Create Fee Structure"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <select
            {...register("category_id", { required: true })}
            className="input-field"
          >
            <option value="">Select Category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <input
            {...register("semester_number", { required: true })}
            type="number"
            className="input-field"
            placeholder="Semester Number"
          />

          <input
            {...register("amount", { required: true })}
            type="number"
            className="input-field"
            placeholder="Amount"
          />

          <select
            {...register("college_id", { required: true })}
            className="input-field"
          >
            <option value="">Select College</option>
            {colleges.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            {...register("program_id", { required: true })}
            className="input-field"
          >
            <option value="">Select Course</option>
            {filteredCourses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            {...register("academic_year_id", { required: true })}
            className="input-field"
          >
            <option value="">Select Academic Year</option>
            {academicYears.map((ay) => (
              <option key={ay.id} value={ay.id}>{ay.name}</option>
            ))}
          </select>

          <input
            {...register("due_date")}
            type="date"
            className="input-field"
          />

          <div className="flex gap-3">
            <button type="submit" className="btn-primary flex-1">
              {editingFee ? "Update Fee" : "Create Fee"}
            </button>
            <button
              type="button"
              onClick={() => {
                setModal(false);
                setEditingFee(null);
                reset();
              }}
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