import React, { useEffect, useState } from "react";
import Layout from "../../components/shared/Layout";
import PageHeader from "../../components/shared/PageHeader";
import Modal from "../../components/shared/Modal";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import api from "../../api/axios";
import { Plus, Building2, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import type { College } from "../../types";

export default function AdminColleges() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState(false);
  const [editingCollege, setEditingCollege] = useState<College | null>(null);

  // ✅ CONTROLLED FORM STATE (FIXES YOUR ISSUE)
  const [form, setForm] = useState({
    name: "",
    code: "",
    address: "",
    phone: "",
    email: "",
    about: "",
  });

  const fetchColleges = async () => {
    try {
      const res = await api.get("/colleges");
      setColleges(res.data.data || []);
    } catch {
      toast.error("Failed to load colleges");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchColleges();
  }, []);

  // ✅ OPEN CREATE
  const openCreate = () => {
    setEditingCollege(null);
    setForm({
      name: "",
      code: "",
      address: "",
      phone: "",
      email: "",
      about: "",
    });
    setModal(true);
  };

  // ✅ OPEN EDIT (THIS FIXES YOUR ISSUE COMPLETELY)
  const handleEdit = (college: College) => {
    setEditingCollege(college);

    setForm({
      name: college.name || "",
      code: college.code || "",
      address: college.address || "",
      phone: college.phone || "",
      email: college.email || "",
      about: college.about || "",
    });

    setModal(true);
  };

  // ✅ SUBMIT (CREATE + UPDATE)
  const handleSubmit = async (e: any) => {
    e.preventDefault();

    try {
      const payload = {
        ...form,
        university_id: 1,
      };

      if (editingCollege) {
        await api.put(`/admin/colleges/${editingCollege.id}`, payload);
        toast.success("College updated!");
      } else {
        await api.post("/admin/colleges", payload);
        toast.success("College created!");
      }

      setModal(false);
      fetchColleges();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Operation failed");
    }
  };

  // ✅ DELETE
  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure?")) return;

    try {
      await api.delete(`/admin/colleges/${id}`);
      toast.success("Deleted!");
      fetchColleges();
    } catch {
      toast.error("Delete failed");
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader
        title="Colleges"
        subtitle="Manage colleges"
        actions={
          <button onClick={openCreate} className="btn-primary flex gap-2">
            <Plus className="w-4 h-4" /> Add College
          </button>
        }
      />

      {/* LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {colleges.map((c) => (
          <div key={c.id} className="card">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>

              <div className="flex-1">
                <h3 className="font-bold">{c.name}</h3>
                <p className="text-sm text-gray-500">Code: {c.code}</p>
                <p className="text-sm text-gray-500">{c.address}</p>
                <p className="text-sm text-primary-600">{c.email}</p>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleEdit(c)}
                    className="btn-secondary flex items-center gap-1 text-sm"
                  >
                    <Pencil className="w-4 h-4" /> Edit
                  </button>

                  <button
                    onClick={() => handleDelete(c.id)}
                    className="btn-danger flex items-center gap-1 text-sm"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title={editingCollege ? "Edit College" : "Add College"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="input-field"
            placeholder="College Name"
          />

          <input
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            className="input-field"
            placeholder="Code"
          />

          <input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="input-field"
            placeholder="Address"
          />

          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="input-field"
            placeholder="Phone"
          />

          <input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="input-field"
            placeholder="Email"
          />

          <textarea
            value={form.about}
            onChange={(e) => setForm({ ...form, about: e.target.value })}
            className="input-field"
            placeholder="About"
            rows={3}
          />

          <div className="flex gap-3">
            <button className="btn-primary flex-1">
              {editingCollege ? "Update" : "Create"}
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