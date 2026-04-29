import React, { useEffect, useState } from "react";
import Layout from "../../components/shared/Layout";
import PageHeader from "../../components/shared/PageHeader";
import Modal from "../../components/shared/Modal";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import api from "../../api/axios";
import { useForm } from "react-hook-form";
import { Plus, Building2 } from "lucide-react";
import toast from "react-hot-toast";
import type { College } from "../../types";

export default function AdminColleges() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const { register, handleSubmit, reset } = useForm();

  const fetchColleges = () => {
    api.get("/colleges").then((r) => {
      setColleges(r.data.data || []);
      setLoading(false);
    });
  };

  useEffect(() => { fetchColleges(); }, []);

  const onSubmit = async (data: any) => {
    try {
      await api.post("/admin/colleges", data);
      toast.success("College created!");
      reset(); setModal(false); fetchColleges();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed");
    }
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <PageHeader
        title="Colleges"
        subtitle="Manage university colleges"
        actions={
          <button onClick={() => setModal(true)}
            className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add College
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {colleges.map((c) => (
          <div key={c.id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">{c.name}</h3>
                <p className="text-sm text-gray-500">Code: {c.code}</p>
                <p className="text-sm text-gray-500 mt-1">{c.address}</p>
                <p className="text-sm text-primary-600 mt-1">{c.email}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {c.programs?.length || 0} Programs
                  </span>
                  <span className={c.is_active ? "badge-success" : "badge-danger"}>
                    {c.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Add New College">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                College Name
              </label>
              <input
                {...register("name", { required: "Required" })}
                className="input-field"
                placeholder="College of Engineering"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                College Code
              </label>
              <input
                {...register("code", { required: "Required" })}
                className="input-field"
                placeholder="COE"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              {...register("address")}
              className="input-field"
              placeholder="123 University Road"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                Email
              </label>
              <input
                {...register("email")}
                type="email"
                className="input-field"
                placeholder="college@university.edu"
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
              placeholder="Brief description of the college..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">
              Create College
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