import React, { useState } from "react";
import Layout from "../../components/shared/Layout";
import PageHeader from "../../components/shared/PageHeader";
import StatusBadge from "../../components/shared/StatusBadge";
import api from "../../api/axios";
import { Search, Loader2, CheckCircle2, Clock, XCircle, User } from "lucide-react";
import toast from "react-hot-toast";

export default function ApplicationStatus() {
  const [appId, setAppId] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<any>(null);

  const checkStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await api.get(`/auth/application-status?application_id=${appId}&email=${email}`);
      setStatus(res.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Application not found");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (s: string) => {
    switch (s) {
      case "enrolled":    return <CheckCircle2 className="w-8 h-8 text-green-500" />;
      case "shortlisted": return <CheckCircle2 className="w-8 h-8 text-blue-500" />;
      case "rejected":    return <XCircle className="w-8 h-8 text-red-500" />;
      default:            return <Clock className="w-8 h-8 text-yellow-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Check Application Status
          </h1>
          <p className="text-gray-500 mt-2">
            Enter your application ID and email to track your progress
          </p>
        </div>

        <div className="card shadow-xl border-0">
          <form onSubmit={checkStatus} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Application ID
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  value={appId}
                  onChange={(e) => setAppId(e.target.value.toUpperCase())}
                  placeholder="APP-XXXX"
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-field"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Check My Status"
              )}
            </button>
          </form>

          {status && (
            <div className="mt-8 pt-8 border-t border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col items-center text-center">
                <div className="p-4 bg-gray-50 rounded-full mb-4">
                  {getStatusIcon(status.status)}
                </div>
                
                <h2 className="text-xl font-bold text-gray-900">
                  {status.first_name} {status.last_name}
                </h2>
                <p className="text-gray-500 text-sm mb-4">
                  Applied for {status.program?.name || "the course"}
                </p>

                <div className="w-full bg-gray-50 rounded-2xl p-4 mt-2">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-500">Current Status</span>
                    <StatusBadge status={status.status} />
                  </div>
                  {status.remarks && (
                    <div className="text-left mt-3">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Latest Update
                      </p>
                      <p className="text-sm text-gray-600 mt-1 italic">
                        "{status.remarks}"
                      </p>
                    </div>
                  )}
                </div>

                {status.status === "shortlisted" && (
                  <div className="mt-6 p-4 bg-blue-50 text-blue-700 rounded-xl text-sm border border-blue-100">
                    Congratulations! You have been shortlisted. Please check your email for the next steps regarding fee payment and enrollment.
                  </div>
                )}

                {status.status === "enrolled" && (
                  <div className="mt-6 p-4 bg-green-50 text-green-700 rounded-xl text-sm border border-green-100">
                    Welcome to the university! Your enrollment is complete. You can now log in using your student credentials.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="text-center mt-8">
          <a href="/apply" className="text-sm font-medium text-primary-600 hover:text-primary-700">
            &larr; Back to Application Portal
          </a>
        </div>
      </div>
    </div>
  );
}
