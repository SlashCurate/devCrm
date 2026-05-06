import React, { useEffect, useState } from "react";
import Layout from "../../components/shared/Layout";
import PageHeader from "../../components/shared/PageHeader";
import Modal from "../../components/shared/Modal";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import api from "../../api/axios";
import { useForm } from "react-hook-form";
import { Plus, BookOpen } from "lucide-react";
import toast from "react-hot-toast";
import type { Program, College } from "../../types";

export default function AdminCourses() {
  const [programs, setPrograms]   = useState<Program[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  const fetchAll = async () => {
    const [pr, cl] = await Promise.all([
      api.get("/courses"),
      api.get("/colleges"),
    ]);
    setPrograms(pr.data.data || []);
    setColleges(cl.data.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const onSubmit = async (data: any) => {
    try {
      await api.post("/admin/courses", {
        ...data,
        college_id: Number(data.college_id),
        duration_years: Number(data.duration_years),
        total_seats: Number(data.total_seats),
      });
      toast.success("Program created!");
      reset(); setModal(false); fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed");
    }
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <PageHeader
        title="Programs"
        subtitle="Manage all university programs"
        actions={
          <button
            onClick={() => setModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Program
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {programs.map((p) => (
          <div key={p.id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">{p.name}</h3>
                <p className="text-sm text-gray-500">Code: {p.code}</p>
                <p className="text-sm text-primary-600 mt-1">
                  {p.college?.name}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
                  <span>Duration: {p.duration_years} yrs</span>
                  <span>Seats: {p.total_seats}</span>
                  <span>Filled: {p.filled_seats}</span>
                  <span>
                    Available: {p.total_seats - p.filled_seats}
                  </span>
                </div>
                <div className="mt-3">
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
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Add New Program">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Program Name
              </label>
              <input
                {...register("name", { required: "Required" })}
                className="input-field"
                placeholder="Computer Science"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Program Code
              </label>
              <input
                {...register("code", { required: "Required" })}
                className="input-field"
                placeholder="CS101"
              />
            </div>
          </div>

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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (Years)
              </label>
              <input
                {...register("duration_years", { required: "Required" })}
                type="number"
                className="input-field"
                placeholder="4"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Seats
              </label>
              <input
                {...register("total_seats", { required: "Required" })}
                type="number"
                className="input-field"
                placeholder="60"
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
              placeholder="Course description..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">
              Create Program
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