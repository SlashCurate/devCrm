import { useEffect, useState } from "react";
import Layout from "../../components/shared/Layout";
import PageHeader from "../../components/shared/PageHeader";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import Modal from "../../components/shared/Modal";
import api from "../../api/axios";
import toast from "react-hot-toast";
import type { AdmissionCycle } from "../../types";
import { 
  Plus, 
  Calendar, 
  Edit2, 
  Trash2, 
  Power, 
  Eye,
  EyeOff,
  AlertCircle,
  ChevronDown
} from "lucide-react";

interface CycleFormData {
  name: string;
  description: string;
  academic_year_id: number;
  application_start_date: string;
  application_end_date: string;
  program_id?: number;
  college_id?: number;
  application_fee: number;
  admission_fee: number;
  max_applications: number;
  is_published: boolean;
}

export default function AdmissionCycles() {
  const [cycles, setCycles] = useState<AdmissionCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCycle, setEditingCycle] = useState<AdmissionCycle | null>(null);
  const [academicYears, setAcademicYears] = useState<{id: number; year_label: string; is_current?: boolean}[]>([]);
  const [programs, setPrograms] = useState<{id: number; name: string}[]>([]);
  const [colleges, setColleges] = useState<{id: number; name: string}[]>([]);

  const [formData, setFormData] = useState<CycleFormData>({
    name: "",
    description: "",
    academic_year_id: 0,
    application_start_date: "",
    application_end_date: "",
    program_id: undefined,
    college_id: undefined,
    application_fee: 0,
    admission_fee: 0,
    max_applications: 0,
    is_published: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [cyclesRes, yearsRes, programsRes, collegesRes] = await Promise.all([
        api.get("/admin/admission-cycles"),
        api.get("/academic-years"),
        api.get("/courses"),
        api.get("/colleges"),
      ]);

      setCycles(
        (cyclesRes.data.data || []).map((c: any) => ({
          id: c.ID,
          name: c.Name,
          description: c.Description,
          academic_year_id: c.AcademicYearID,
          academic_year: c.AcademicYear
            ? {
                id: c.AcademicYear.ID,
                year_label: c.AcademicYear.YearLabel,
                start_date: c.AcademicYear.StartDate,
                end_date: c.AcademicYear.EndDate,
                is_current: c.AcademicYear.IsCurrent,
              }
            : null,

          application_start_date: c.ApplicationStartDate,
          application_end_date: c.ApplicationEndDate,

          is_active: c.IsActive,
          is_published: c.IsPublished,

          program_id: c.ProgramID,
          college_id: c.CollegeID,

          application_fee: c.ApplicationFee,
          admission_fee: c.AdmissionFee,

          max_applications: c.MaxApplications,
          total_applications: c.TotalApplications,
        }))
      );

      // ✅ FIX: normalize academic years (IMPORTANT)
      setAcademicYears(
        (yearsRes.data.data || []).map((y: any) => ({
          id: y.ID,
          year_label: y.YearLabel,
          is_current: y.IsCurrent,
        }))
      );

      setPrograms(programsRes.data.data || []);
      setColleges(collegesRes.data.data || []);
      console.log(cyclesRes.data.data);

    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIX: safe date format helper
  const formatDate = (date?: string) => {
    if (!date) return "";
    return new Date(date).toISOString().slice(0, 16);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      application_start_date: new Date(formData.application_start_date).toISOString(),
      application_end_date: new Date(formData.application_end_date).toISOString(),
    };

    try {
      if (editingCycle) {
        await api.put(`/admin/admission-cycles/${editingCycle.id}`, payload);
        toast.success("Admission cycle updated");
      } else {
        await api.post("/admin/admission-cycles", payload);
        toast.success("Admission cycle created");
      }
      setShowModal(false);
      setEditingCycle(null);
      resetForm();
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Operation failed");
    }
  };

  const handleToggle = async (id: number, action: string) => {
    try {
      await api.put(`/admin/admission-cycles/${id}/toggle?action=${action}`);
      toast.success(`Cycle ${action}d successfully`);
      fetchData();
    } catch (err) {
      toast.error("Failed to update cycle");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this admission cycle?")) return;
    
    try {
      await api.delete(`/admin/admission-cycles/${id}`);
      toast.success("Admission cycle deleted");
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete");
    }
  };

  const openEditModal = (cycle: AdmissionCycle) => {
    setEditingCycle(cycle);
    setFormData({
      name: cycle.name,
      description: cycle.description || "",
      academic_year_id: cycle.academic_year_id,
      application_start_date: formatDate(cycle.application_start_date), // ✅ FIX
      application_end_date: formatDate(cycle.application_end_date),     // ✅ FIX
      program_id: cycle.program_id,
      college_id: cycle.college_id,
      application_fee: cycle.application_fee,
      admission_fee: cycle.admission_fee,
      max_applications: cycle.max_applications,
      is_published: cycle.is_published,
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingCycle(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      academic_year_id: academicYears[0]?.id || 0,
      application_start_date: "",
      application_end_date: "",
      program_id: undefined,
      college_id: undefined,
      application_fee: 0,
      admission_fee: 0,
      max_applications: 0,
      is_published: false,
    });
  };

  const isCycleOpen = (cycle: AdmissionCycle) => {
    const now = new Date();
    const start = new Date(cycle.application_start_date);
    const end = new Date(cycle.application_end_date);
    return cycle.is_active && cycle.is_published && now >= start && now <= end;
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
        title="Admission Cycles"
        subtitle="Manage admission windows and application periods"
        actions={
          <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Cycle
          </button>
        }
      />
      {/* Cycles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {cycles.map((cycle) => {
          const isOpen = isCycleOpen(cycle);
          
          return (
            <div key={cycle.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    isOpen ? "bg-green-100 text-green-600" : 
                    cycle.is_active ? "bg-yellow-100 text-yellow-600" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{cycle.name}</h3>
                    <p className="text-xs text-gray-500">
                      {cycle.academic_year?.year_label}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditModal(cycle)}
                    className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(cycle.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className={`font-medium ${
                    isOpen ? "text-green-600" : 
                    cycle.is_active ? "text-yellow-600" :
                    "text-gray-500"
                  }`}>
                    {isOpen ? "Open" : cycle.is_active ? "Scheduled" : "Closed"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Start Date</span>
                  <span className="font-medium">
                    {new Date(cycle.application_start_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">End Date</span>
                  <span className="font-medium">
                    {new Date(cycle.application_end_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Application Fee</span>
                  <span className="font-medium">₹{cycle.application_fee}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Admission Fee</span>
                  <span className="font-medium">₹{cycle.admission_fee}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <button
                  onClick={() => handleToggle(cycle.id, cycle.is_active ? "close" : "open")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    cycle.is_active
                      ? "bg-red-50 text-red-600 hover:bg-red-100"
                      : "bg-green-50 text-green-600 hover:bg-green-100"
                  }`}
                >
                  <Power className="w-4 h-4" />
                  {cycle.is_active ? "Close" : "Open"}
                </button>
                <button
                  onClick={() => handleToggle(cycle.id, cycle.is_published ? "unpublish" : "publish")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    cycle.is_published
                      ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                  }`}
                >
                  {cycle.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {cycle.is_published ? "Hide" : "Publish"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {cycles.length === 0 && (
        <div className="card text-center py-16">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium mb-2">No admission cycles yet</p>
          <p className="text-gray-400 text-sm mb-4">Create your first admission cycle to start accepting applications</p>
          <button onClick={openCreateModal} className="btn-primary">
            Create Cycle
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingCycle ? "Edit Admission Cycle" : "Create Admission Cycle"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Cycle Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              placeholder="e.g., B.Tech 2024-25 Admission"
            />
          </div>

          <div>
            <label className="form-label">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field resize-none"
              rows={3}
              placeholder="Brief description of this admission cycle"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Academic Year *</label>
              {academicYears.length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-amber-800 font-medium">No Academic Years Found</p>
                      <p className="text-xs text-amber-600 mt-1">
                        Create an academic year first in University Settings
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <select
                    required
                    value={formData.academic_year_id || ""}
                    onChange={(e) => setFormData({ ...formData, academic_year_id: Number(e.target.value) })}
                    className="input-field appearance-none pr-10"
                  >
                    <option value="">Select Academic Year</option>
                    {academicYears.map((year) => (
                      <option key={year.id} value={year.id}>
                        {year.year_label} {year.is_current ? "(Current)" : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              )}
              
              {/* Quick Create Academic Year */}
              {academicYears.length === 0 && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-2 font-medium">Quick Create Academic Year:</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        const currentYear = new Date().getFullYear();
                        const nextYear = currentYear + 1;
                        const yearLabel = `${currentYear}-${nextYear.toString().slice(2)}`;
                        
                        try {
                          await api.post("/academic-years", {
                            year_label: yearLabel,
                            start_date: `${currentYear}-06-01`,
                            end_date: `${nextYear}-05-31`,
                            is_current: true,
                          });
                          toast.success(`Created academic year ${yearLabel}`);
                          fetchData();
                        } catch (err: any) {
                          toast.error(err.response?.data?.error || "Failed to create academic year");
                        }
                      }}
                      className="flex-1 py-2 px-3 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700"
                    >
                      Create {new Date().getFullYear()}-{new Date().getFullYear() + 1}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="form-label">Max Applications (0 = unlimited)</label>
              <input
                type="number"
                min="0"
                value={formData.max_applications}
                onChange={(e) => setFormData({ ...formData, max_applications: Number(e.target.value) })}
                className="input-field"
                placeholder="Leave 0 for unlimited"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Application Start *</label>
              <input
                type="datetime-local"
                required
                value={formData.application_start_date}
                onChange={(e) => setFormData({ ...formData, application_start_date: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="form-label">Application End *</label>
              <input
                type="datetime-local"
                required
                value={formData.application_end_date}
                onChange={(e) => setFormData({ ...formData, application_end_date: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Program (Optional)</label>
              <select
                value={formData.program_id || ""}
                onChange={(e) => setFormData({ ...formData, program_id: e.target.value ? Number(e.target.value) : undefined })}
                className="input-field"
              >
                <option value="">All Programs</option>
                {programs.map((prog) => (
                  <option key={prog.id} value={prog.id}>{prog.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">College (Optional)</label>
              <select
                value={formData.college_id || ""}
                onChange={(e) => setFormData({ ...formData, college_id: e.target.value ? Number(e.target.value) : undefined })}
                className="input-field"
              >
                <option value="">All Colleges</option>
                {colleges.map((col) => (
                  <option key={col.id} value={col.id}>{col.name}</option>
                ))}
              </select>
            </div>
          </div> */}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Application Fee (₹)</label>
              <input
                type="number"
                min="0"
                value={formData.application_fee}
                onChange={(e) => setFormData({ ...formData, application_fee: Number(e.target.value) })}
                className="input-field"
              />
            </div>

            <div>
              <label className="form-label">Admission Fee (₹)</label>
              <input
                type="number"
                min="0"
                value={formData.admission_fee}
                onChange={(e) => setFormData({ ...formData, admission_fee: Number(e.target.value) })}
                className="input-field"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_published"
              checked={formData.is_published}
              onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300"
            />
            <label htmlFor="is_published" className="text-sm text-gray-700">
              Publish immediately (visible to public)
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="flex-1 btn-primary">
              {editingCycle ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
