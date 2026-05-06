import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { 
  GraduationCap, 
  FileText, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Upload,
  LogOut
} from "lucide-react";
import type { Applicant, AdmissionCycle } from "../../types";

interface ApplicantDashboardData {
  applicant: Applicant;
  cycle: AdmissionCycle;
  next_steps: string[];
}

const statusSteps = [
  { key: "draft", label: "Draft", icon: FileText },
  { key: "submitted", label: "Submitted", icon: CheckCircle },
  { key: "payment_pending", label: "Payment", icon: CreditCard },
  { key: "payment_completed", label: "Paid", icon: CheckCircle },
  { key: "under_review", label: "Review", icon: Clock },
  { key: "shortlisted", label: "Shortlisted", icon: CheckCircle },
  { key: "document_verification", label: "Documents", icon: Upload },
  { key: "admission_fee_pending", label: "Admission Fee", icon: CreditCard },
  { key: "admission_fee_paid", label: "Fee Paid", icon: CheckCircle },
  { key: "enrolled", label: "Enrolled", icon: GraduationCap },
];

const statusMessages: Record<string, { title: string; message: string; action?: string }> = {
  draft: {
    title: "Application in Progress",
    message: "Your application is saved as a draft. Complete and submit to proceed.",
    action: "Complete Application"
  },
  submitted: {
    title: "Application Submitted",
    message: "Your application has been submitted. Complete the payment to proceed.",
    action: "Pay Application Fee"
  },
  payment_pending: {
    title: "Payment Pending",
    message: "Please complete the application fee payment to proceed with your application.",
    action: "Make Payment"
  },
  payment_completed: {
    title: "Payment Completed",
    message: "Your payment has been received. Your application is now under review.",
  },
  under_review: {
    title: "Under Review",
    message: "Your application is being reviewed by our admissions team. You will be notified once a decision is made.",
  },
  shortlisted: {
    title: "Congratulations! Shortlisted",
    message: "You have been shortlisted for admission. Please upload your documents for verification.",
    action: "Upload Documents"
  },
  document_verification: {
    title: "Document Verification",
    message: "Your documents are being verified. Please wait for confirmation.",
  },
  admission_fee_pending: {
    title: "Admission Fee Pending",
    message: "Please pay the admission fee to confirm your seat.",
    action: "Pay Admission Fee"
  },
  admission_fee_paid: {
    title: "Admission Fee Paid",
    message: "Your admission fee has been received. Your enrollment is being processed.",
  },
  enrolled: {
    title: "Enrolled Successfully",
    message: "You have been enrolled successfully. Your student account is ready.",
    action: "Go to Student Portal"
  },
  rejected: {
    title: "Application Rejected",
    message: "We regret to inform you that your application has not been accepted.",
  },
  waitlisted: {
    title: "On Waitlist",
    message: "You have been placed on the waitlist. You will be notified if a seat becomes available.",
  },
};

export default function ApplicantDashboard() {
  const [data, setData] = useState<ApplicantDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    // Check for applicant data in localStorage
    const appId = localStorage.getItem("applicant_id");
    const email = localStorage.getItem("applicant_email");
    
    if (!appId || !email) {
      // Redirect to status check if no session
      window.location.href = "/application-status";
      return;
    }

    fetchApplicantData(appId, email);
  }, []);

  const fetchApplicantData = async (appId: string, email: string) => {
    try {
      const res = await api.get(`/auth/application-status?application_id=${appId}&email=${email}`);
      setData(res.data.data);
    } catch (err: any) {
      toast.error("Failed to load application data");
      // Clear invalid session
      localStorage.removeItem("applicant_id");
      localStorage.removeItem("applicant_email");
      window.location.href = "/application-status";
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("applicant_id");
    localStorage.removeItem("applicant_email");
    window.location.href = "/";
  };

  const getCurrentStepIndex = (status: string) => {
    return statusSteps.findIndex(s => s.key === status);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-600 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">Loading your application...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Session Expired</h2>
          <p className="text-gray-500 mb-6">Please check your application status to continue.</p>
          <Link to="/application-status" className="btn-primary w-full block">
            Check Status
          </Link>
        </div>
      </div>
    );
  }

  const { applicant } = data;
  const currentStepIndex = getCurrentStepIndex(applicant.status);
  const statusInfo = statusMessages[applicant.status] || statusMessages.draft;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-600">
      {/* Header */}
      <nav className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-white font-bold">University ERP</p>
              <p className="text-blue-300 text-xs">Applicant Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-blue-200 text-sm hidden sm:block">
              {applicant.first_name} {applicant.last_name}
            </span>
            <button 
              onClick={() => setShowLogoutConfirm(true)}
              className="p-2 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Application ID Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-blue-300 text-sm mb-1">Application ID</p>
              <p className="text-white text-2xl font-bold tracking-wider">{applicant.application_id}</p>
            </div>
            <div className="flex items-center gap-6">
              <div>
                <p className="text-blue-300 text-sm mb-1">Program</p>
                <p className="text-white font-semibold">{applicant.program?.name}</p>
              </div>
              <div>
                <p className="text-blue-300 text-sm mb-1">College</p>
                <p className="text-white font-semibold">{applicant.college?.name}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Status & Progress */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Status */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${
                  applicant.status === "rejected" || applicant.status === "cancelled" ? "bg-red-100" :
                  applicant.status === "enrolled" ? "bg-green-100" :
                  applicant.status === "shortlisted" ? "bg-purple-100" :
                  "bg-blue-100"
                }`}>
                  {(applicant.status as string) === "rejected" ? (
                    <AlertCircle className={`w-8 h-8 ${
                      applicant.status === "rejected" || applicant.status === "cancelled" ? "text-red-600" :
                      applicant.status === "enrolled" ? "text-green-600" :
                      applicant.status === "shortlisted" ? "text-purple-600" :
                      "text-blue-600"
                    }`} />
                  ) : (
                    <CheckCircle className={`w-8 h-8 ${
                      applicant.status === "rejected" || applicant.status === "cancelled" ? "text-red-600" :
                      applicant.status === "enrolled" ? "text-green-600" :
                      applicant.status === "shortlisted" ? "text-purple-600" :
                      "text-blue-600"
                    }`} />
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">{statusInfo.title}</h2>
                  <p className="text-gray-600 mb-4">{statusInfo.message}</p>
                  {statusInfo.action && (
                    <button 
                      onClick={() => {
                        if (applicant.status === "submitted" || applicant.status === "payment_pending") {
                          toast.success("Payment gateway will open");
                        } else if (applicant.status === "shortlisted") {
                          toast.success("Document upload will open");
                        } else if (applicant.status === "admission_fee_pending") {
                          toast.success("Payment gateway will open");
                        } else if (applicant.status === "enrolled") {
                          window.location.href = "/login";
                        }
                      }}
                      className="btn-primary"
                    >
                      {statusInfo.action}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Progress Tracker */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="font-bold text-gray-900 mb-6">Application Progress</h3>
              <div className="relative">
                <div className="flex items-start justify-between">
                  {statusSteps.map((step, index) => {
                    const isCompleted = index <= currentStepIndex && applicant.status !== "rejected" && applicant.status !== "waitlisted";
                    const isCurrent = index === currentStepIndex;
                    const isFailed = (applicant.status === "rejected" || applicant.status === "waitlisted") && index === currentStepIndex;
                    
                    return (
                      <div key={step.key} className="flex flex-col items-center flex-1 relative">
                        {/* Connector line */}
                        {index < statusSteps.length - 1 && (
                          <div className={`absolute top-4 left-1/2 w-full h-0.5 ${
                            isCompleted && !isFailed ? "bg-green-500" : "bg-gray-200"
                          }`} />
                        )}
                        
                        {/* Step circle */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                          isFailed ? "bg-red-500 text-white" :
                          isCompleted ? "bg-green-500 text-white" :
                          isCurrent ? "bg-primary-600 text-white ring-4 ring-primary-100" :
                          "bg-gray-200 text-gray-400"
                        }`}>
                          {isCompleted && !isFailed ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <step.icon className="w-4 h-4" />
                          )}
                        </div>
                        
                        {/* Step label */}
                        <span className={`text-xs mt-2 text-center leading-tight hidden sm:block ${
                          isFailed ? "text-red-600 font-semibold" :
                          isCurrent ? "text-primary-600 font-semibold" :
                          isCompleted ? "text-green-600" :
                          "text-gray-400"
                        }`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Application Details */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="font-bold text-gray-900 mb-4">Application Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-gray-500 text-sm mb-1">Full Name</p>
                  <p className="font-semibold text-gray-900">{applicant.first_name} {applicant.last_name}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-gray-500 text-sm mb-1">Email</p>
                  <p className="font-semibold text-gray-900">{applicant.email}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-gray-500 text-sm mb-1">Phone</p>
                  <p className="font-semibold text-gray-900">{applicant.phone || "Not provided"}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-gray-500 text-sm mb-1">Submitted On</p>
                  <p className="font-semibold text-gray-900">
                    {applicant.submitted_at ? new Date(applicant.submitted_at).toLocaleDateString() : "Draft"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Info Cards */}
          <div className="space-y-6">
            {/* Fee Summary */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary-600" />
                Fee Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Application Fee</span>
                  <span className="font-semibold">₹{applicant.application_fee?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Admission Fee</span>
                  <span className="font-semibold">₹{applicant.admission_fee?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-bold text-primary-600">
                    ₹{((applicant.application_fee || 0) + (applicant.admission_fee || 0)).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Status */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="font-bold text-gray-900 mb-4">Payment Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm">Application Fee</span>
                  <span className={`text-sm font-semibold ${
                    applicant.application_fee_paid ? "text-green-600" : "text-yellow-600"
                  }`}>
                    {applicant.application_fee_paid ? "Paid" : "Pending"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm">Admission Fee</span>
                  <span className={`text-sm font-semibold ${
                    applicant.admission_fee_paid ? "text-green-600" : 
                    applicant.status === "admission_fee_pending" ? "text-red-600" : "text-gray-400"
                  }`}>
                    {applicant.admission_fee_paid ? "Paid" : 
                     applicant.status === "admission_fee_pending" ? "Required" : "Not Required"}
                  </span>
                </div>
              </div>
            </div>

            {/* Need Help */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="font-bold text-gray-900 mb-2">Need Help?</h3>
              <p className="text-gray-600 text-sm mb-4">
                If you have any questions about your application, please contact our admissions office.
              </p>
              <div className="space-y-2 text-sm">
                <p className="text-gray-600">
                  <span className="font-semibold">Email:</span> admissions@university.edu
                </p>
                <p className="text-gray-600">
                  <span className="font-semibold">Phone:</span> +91 1234567890
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Logout</h3>
            <p className="text-gray-600 mb-4">Are you sure you want to logout? You can check your status again anytime.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={handleLogout}
                className="flex-1 btn-primary bg-red-600 hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
