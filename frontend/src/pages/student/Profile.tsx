import React, { useEffect, useState } from "react";
import Layout from "../../components/shared/Layout";
import PageHeader from "../../components/shared/PageHeader";
import api from "../../api/axios";
import toast from "react-hot-toast";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import { Student } from "../../types";
import { Save, AlertCircle, Clock, CheckCircle, XCircle } from "lucide-react";

export default function StudentProfile() {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"easy" | "sensitive">("easy");
  const [requests, setRequests] = useState<any[]>([]);

  // Easy Form State
  const [formData, setFormData] = useState({
    phone: "",
    address: "",
    city: "",
    state: "",
    pin_code: "",
    previous_school: "",
    previous_grade: "",
  });

  // Sensitive Form State
  const [sensitiveData, setSensitiveData] = useState({
    field_name: "first_name",
    new_value: "",
    reason: "",
  });

  const fetchProfile = async () => {
    try {
      const res = await api.get("/student/profile");
      setStudent(res.data.data);
      setFormData({
        phone: res.data.data.phone || "",
        address: res.data.data.address || "",
        city: res.data.data.city || "",
        state: res.data.data.state || "",
        pin_code: res.data.data.pin_code || "",
        previous_school: res.data.data.previous_school || "",
        previous_grade: res.data.data.previous_grade || "",
      });
    } catch (error) {
      toast.error("Failed to load profile");
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await api.get("/student/profile/change-requests");
      setRequests(res.data.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    Promise.all([fetchProfile(), fetchRequests()]).finally(() => setLoading(false));
  }, []);

  const handleEasySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put("/student/profile", formData);
      toast.success("Profile updated successfully!");
      fetchProfile();
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  const handleSensitiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sensitiveData.new_value || !sensitiveData.reason) {
      toast.error("Please provide both new value and reason.");
      return;
    }
    try {
      await api.post("/student/profile/change-requests", {
        field_name: sensitiveData.field_name,
        old_value: String((student as any)?.[sensitiveData.field_name] || ""),
        new_value: sensitiveData.new_value,
        reason: sensitiveData.reason,
        document_url: "",
      });
      toast.success("Change request submitted!");
      setSensitiveData({ ...sensitiveData, new_value: "", reason: "" });
      fetchRequests();
    } catch (error) {
      toast.error("Failed to submit request");
    }
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;
  if (!student) return <Layout><p>Error loading profile</p></Layout>;

  return (
    <Layout>
      <PageHeader title="My Profile" subtitle="Manage your personal details" />

      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab("easy")}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === "easy"
              ? "bg-primary-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Basic Information
        </button>
        <button
          onClick={() => setActiveTab("sensitive")}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === "sensitive"
              ? "bg-primary-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Sensitive Changes
        </button>
      </div>

      {activeTab === "easy" && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Edit Basic Information</h2>
          <form onSubmit={handleEasySubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Phone</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Address</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">City</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">State</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Pin Code</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.pin_code}
                  onChange={(e) => setFormData({ ...formData, pin_code: e.target.value })}
                />
              </div>
            </div>
            <button type="submit" className="btn-primary flex items-center gap-2 mt-4">
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </form>
        </div>
      )}

      {activeTab === "sensitive" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              Request Sensitive Change
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Changes to core identity fields require Registrar approval. Please provide a valid reason.
            </p>
            <form onSubmit={handleSensitiveSubmit} className="space-y-4">
              <div>
                <label className="form-label">Field to Change</label>
                <select
                  className="input-field"
                  value={sensitiveData.field_name}
                  onChange={(e) => setSensitiveData({ ...sensitiveData, field_name: e.target.value })}
                >
                  <option value="first_name">First Name</option>
                  <option value="last_name">Last Name</option>
                  {/* <option value="dob">Date of Birth</option>//not using this for now */}
                  <option value="gender">Gender</option>
                  <option value="category">Category</option>
                </select>
              </div>
              <div>
                <label className="form-label">Current Value</label>
                <input
                  type="text"
                  className="input-field bg-gray-100"
                  disabled
                  value={(student as any)[sensitiveData.field_name] || "N/A"}
                />
              </div>
              <div>
                <label className="form-label">New Value</label>
                <input
                  type="text"
                  className="input-field"
                  required
                  value={sensitiveData.new_value}
                  onChange={(e) => setSensitiveData({ ...sensitiveData, new_value: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Reason for Change</label>
                <textarea
                  className="input-field"
                  rows={3}
                  required
                  value={sensitiveData.reason}
                  onChange={(e) => setSensitiveData({ ...sensitiveData, reason: e.target.value })}
                />
              </div>
              <button type="submit" className="btn-primary w-full">Submit Request</button>
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">My Change Requests</h2>
            {requests.length === 0 ? (
              <p className="text-gray-500 text-sm">No pending or past requests.</p>
            ) : (
              <div className="space-y-4">
                {requests.map((req) => (
                  <div key={req.id} className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-gray-900 text-sm">{req.TicketID}</span>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        req.Status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        req.Status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {req.Status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">
                      <span className="font-semibold">Field:</span> {req.FieldName}
                    </p>
                    <p className="text-xs text-gray-600">
                      <span className="font-semibold">Requested Change:</span> {req.OldValue} → {req.NewValue}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
