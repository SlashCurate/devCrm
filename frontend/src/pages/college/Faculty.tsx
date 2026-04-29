import React, { useEffect, useState } from "react";
import Layout from "../../components/shared/Layout";
import PageHeader from "../../components/shared/PageHeader";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import api from "../../api/axios";
import type { Faculty } from "../../types";
import { Users, Plus, Search, Edit2, Trash2, Mail, Phone, BookOpen, Award } from "lucide-react";
import toast from "react-hot-toast";

export default function CollegeFaculty() {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    phone: "",
    first_name: "",
    last_name: "",
    department: "",
    designation: "",
    qualification: "",
    experience: 0,
    specialization: "",
    employee_code: "",
    salary: 0,
  });

  useEffect(() => {
    fetchFaculty();
  }, []);

  const fetchFaculty = async () => {
    try {
      const res = await api.get("/college/faculty");
      setFaculty(res.data.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to fetch faculty");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingFaculty) {
        await api.put(`/college/faculty/${editingFaculty.id}`, {
          first_name: formData.first_name,
          last_name: formData.last_name,
          department: formData.department,
          designation: formData.designation,
          qualification: formData.qualification,
          experience: formData.experience,
          specialization: formData.specialization,
          phone: formData.phone,
          salary: formData.salary,
          is_active: true,
        });
        toast.success("Faculty updated successfully");
      } else {
        await api.post("/college/faculty", formData);
        toast.success("Faculty created successfully");
      }
      setShowModal(false);
      setEditingFaculty(null);
      resetForm();
      fetchFaculty();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to save faculty");
    }
  };

  const handleEdit = (f: Faculty) => {
    setEditingFaculty(f);
    setFormData({
      username: f.user?.username || "",
      email: f.user?.email || "",
      password: "",
      phone: f.phone || "",
      first_name: f.first_name,
      last_name: f.last_name,
      department: f.department?.name || "",
      designation: f.designation || "",
      qualification: f.qualification || "",
      experience: f.experience_years || 0,
      specialization: f.specialization || "",
      employee_code: f.employee_code || "",
      salary: f.basic_salary || 0,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this faculty member?")) return;
    try {
      await api.delete(`/college/faculty/${id}`);
      toast.success("Faculty deleted successfully");
      fetchFaculty();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete faculty");
    }
  };

  const resetForm = () => {
    setFormData({
      username: "",
      email: "",
      password: "",
      phone: "",
      first_name: "",
      last_name: "",
      department: "",
      designation: "",
      qualification: "",
      experience: 0,
      specialization: "",
      employee_code: "",
      salary: 0,
    });
  };

  const filteredFaculty = faculty.filter(
    (f) =>
      f.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      f.last_name?.toLowerCase().includes(search.toLowerCase()) ||
      f.employee_code?.toLowerCase().includes(search.toLowerCase()) ||
      f.department?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const designations = ["Professor", "Associate Professor", "Assistant Professor", "Lecturer", "Guest Faculty"];
  const departments = ["Computer Science", "Mathematics", "Physics", "Chemistry", "Biology", "English", "History", "Economics", "Business", "Engineering"];

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <PageHeader
        title="Faculty Management"
        subtitle="Manage teaching staff and professors"
        actions={
          <button
            onClick={() => {
              setEditingFaculty(null);
              resetForm();
              setShowModal(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Faculty
          </button>
        }
      />

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search faculty by name, code, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>
      </div>

      {/* Faculty Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFaculty.map((f) => (
          <div key={f.id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">
                    {f.first_name} {f.last_name}
                  </h3>
                  <p className="text-sm text-gray-500">{f.employee_code}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(f)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(f.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Award className="w-4 h-4" />
                <span>{f.designation}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <BookOpen className="w-4 h-4" />
                <span>{f.department?.name}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4" />
                <span>{f.user?.email}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{f.phone}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Experience</span>
                <span className="font-medium">{f.experience_years} years</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-500">Qualification</span>
                <span className="font-medium">{f.qualification}</span>
              </div>
            </div>

            <div className="mt-3">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${f.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {f.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredFaculty.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No faculty members found</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">
                {editingFaculty ? "Edit Faculty" : "Add New Faculty"}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!editingFaculty && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="input-field w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="input-field w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="input-field w-full"
                        required={!editingFaculty}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employee Code</label>
                      <input
                        type="text"
                        value={formData.employee_code}
                        onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                        className="input-field w-full"
                        required
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="input-field w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="input-field w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="input-field w-full"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                  <select
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="input-field w-full"
                    required
                  >
                    <option value="">Select Designation</option>
                    {designations.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
                  <input
                    type="text"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    className="input-field w-full"
                    placeholder="e.g., Ph.D. in Computer Science"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="input-field w-full"
                    placeholder="e.g., AI/ML"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) })}
                    className="input-field w-full"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input-field w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salary</label>
                  <input
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) })}
                    className="input-field w-full"
                    min="0"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingFaculty ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
