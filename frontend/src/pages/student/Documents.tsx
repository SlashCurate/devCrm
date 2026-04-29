import React, { useEffect, useState } from "react";
import Layout from "../../components/shared/Layout";
import PageHeader from "../../components/shared/PageHeader";
import Modal from "../../components/shared/Modal";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import api from "../../api/axios";
import { useForm } from "react-hook-form";
import { Plus, FileText, CheckCircle, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { StudentDocument as Document } from "../../types";

export default function StudentDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(false);
  const { register, handleSubmit, reset } = useForm();

  const fetchDocs = () => {
    api.get("/student/documents").then((r) => {
      setDocuments(r.data.data || []);
      setLoading(false);
    });
  };

  useEffect(() => { fetchDocs(); }, []);

  const onSubmit = async (data: any) => {
    try {
      await api.post("/student/documents", {
        ...data,
        application_id: data.application_id
          ? Number(data.application_id)
          : undefined,
      });
      toast.success("Document uploaded!");
      reset();
      setModal(false);
      fetchDocs();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Upload failed");
    }
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;

  return (
    <Layout>
      <PageHeader
        title="Documents"
        subtitle="Upload and manage your documents"
        actions={
          <button
            onClick={() => setModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Upload Document
          </button>
        }
      />

      {documents.length === 0 ? (
        <div className="card text-center py-16">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 font-medium">No documents uploaded yet</p>
          <p className="text-gray-400 text-sm mt-1">
            Upload your documents for verification
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div key={doc.id}
              className="card hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-xl flex-shrink-0">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">
                    {doc.file_name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 capitalize">
                    {(doc.document_type || '').replace(/_/g, " ")}
                  </p>
                  <div className="mt-2 flex items-center gap-1">
                    {doc.is_verified ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-xs text-green-600 font-medium">
                          Verified
                        </span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5 text-yellow-500" />
                        <span className="text-xs text-yellow-600 font-medium">
                          Pending Verification
                        </span>
                      </>
                    )}
                  </div>
                  {doc.remarks && (
                    <p className="text-xs text-gray-400 mt-1 italic">
                      {doc.remarks}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title="Upload Document"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Document Type *
            </label>
            <select
              {...register("document_type", { required: "Required" })}
              className="input-field"
            >
              <option value="">Select Type</option>
              <option value="marksheet">Marksheet</option>
              <option value="id_proof">ID Proof (Aadhar/PAN)</option>
              <option value="photo">Passport Photo</option>
              <option value="birth_certificate">Birth Certificate</option>
              <option value="transfer_certificate">Transfer Certificate</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              File Name *
            </label>
            <input
              {...register("file_name", { required: "Required" })}
              className="input-field"
              placeholder="marksheet_class12.pdf"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              File URL *
            </label>
            <input
              {...register("file_url", { required: "Required" })}
              className="input-field"
              placeholder="https://storage.example.com/doc.pdf"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                MIME Type
              </label>
              <select {...register("mime_type")} className="input-field">
                <option value="application/pdf">PDF</option>
                <option value="image/jpeg">JPEG</option>
                <option value="image/png">PNG</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Application ID (optional)
              </label>
              <input
                {...register("application_id")}
                type="number"
                className="input-field"
                placeholder="Leave blank if general"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">
              Upload
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