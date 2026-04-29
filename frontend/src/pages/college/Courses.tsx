import React, { useEffect, useState } from "react";
import Layout from "../../components/shared/Layout";
import PageHeader from "../../components/shared/PageHeader";
import Modal from "../../components/shared/Modal";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import api from "../../api/axios";
import { useForm } from "react-hook-form";
import { Edit, BookOpen } from "lucide-react";
import toast from "react-hot-toast";
import type { Program } from "../../types";

export default function CollegeCourses() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selected, setSelected] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const { register, handleSubmit, reset, setValue } = useForm();

  const fetchCourses = () => {
    api.get("/college/programs").then((r) => {
      setPrograms(r.data.data || []);
      setLoading(false);
    });
  };

  useEffect(() => { fetchCourses(); }, []);

  const openEdit = (program: Program) => {
    setSelected(program);
    setValue("name", program.name);
    setValue("code", program.code);
    setValue("duration", program.duration_years);
    setValue("total_seats", program.total_seats);
    setValue("description", program.description);
    setEditModal(true);
  };

  const onUpdate = async (data: any) => {
    if (!selected) return;
    try {
      await api.put(`/college/programs/${selected.id}`, {
        ...data,
        duration: Number(data.duration),
        total_seats: Number(data.total_seats),
      });
      toast.success("Program updated!");
      reset();
      setEditModal(false);
      fetchCourses();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed");
    }
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <PageHeader
        title="Programs"
        subtitle="Manage programs in your college"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {programs.map((p) => (
          <div
            key={p.id}
            className="card hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-xl">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{p.name}</h3>
                  <p className="text-xs text-gray-500">Code: {p.code}</p>
                </div>
              </div>
              <button
                onClick={() => openEdit(p)}
                className="p-1.5 text-gray-400 hover:text-primary-600
                           hover:bg-primary-50 rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Duration</span>
                <span className="font-medium">{p.duration_years} Years</span>
              </div>
              <div className="flex justify-between">
                <span>Total Seats</span>
                <span className="font-medium">{p.total_seats}</span>
              </div>
              <div className="flex justify-between">
                <span>Filled</span>
                <span className="font-medium">{p.filled_seats}</span>
              </div>
              <div className="flex justify-between">
                <span>Available</span>
                <span className={`font-medium ${
                  (p.total_seats - p.filled_seats) > 10
                    ? "text-green-600"
                    : (p.total_seats - p.filled_seats) > 0
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}>
                  {p.total_seats - p.filled_seats}
                </span>
              </div>
            </div>

            {/* Seat fill bar */}
            <div className="mt-4">
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-primary-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      (p.filled_seats / p.total_seats) * 100, 100
                    )}%`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {Math.round((p.filled_seats / p.total_seats) * 100)}% filled
              </p>
            </div>

            {p.description && (
              <p className="text-xs text-gray-500 mt-3 line-clamp-2">
                {p.description}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Edit Program Modal */}
      <Modal
        isOpen={editModal}
        onClose={() => setEditModal(false)}
        title="Edit Program"
      >
        <form onSubmit={handleSubmit(onUpdate)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Name
              </label>
              <input
                {...register("name", { required: true })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Code
              </label>
              <input
                {...register("code", { required: true })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (Years)
              </label>
              <input
                {...register("duration")}
                type="number"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Seats
              </label>
              <input
                {...register("total_seats")}
                type="number"
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              {...register("description")}
              className="input-field"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">
              Update Course
            </button>
            <button
              type="button"
              onClick={() => setEditModal(false)}
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