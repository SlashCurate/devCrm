import { useEffect, useState, useCallback, useRef, Fragment } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import api from "../../api/axios";
import toast from "react-hot-toast";
import type { College, Course } from "../../types";
import {
  GraduationCap, Send, CheckCircle,
  User, BookOpen, Layers, FileText, XCircle, Clock,
  Calendar, Phone, Mail, Award,
  AlertCircle, ChevronRight, ChevronLeft,
  ShieldCheck, FileCheck, ArrowRight, RefreshCw,
  CreditCard, IndianRupee
} from "lucide-react";

// Add Modal component if not exists
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// Bank details constant - should be at top level
const BANK_DETAILS = {
  name: "ABC University Bank",
  account: "1234567890",
  ifsc: "ABC0001234",
  branch: "Main Branch, City",
};

interface ApplyForm {
  cycle_id: number;
  course_id: number;
  college_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  dob: string;
  gender: string;
  address: string;
  city: string;
  state: string;
  pin_code: string;
  previous_school: string;
  previous_grade: string;
  statement: string;
  category: string;
}

interface ApplicantInfo {
  application_id: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
}

interface AdmissionCycle {
  id: number;
  name: string;
  description: string;
  application_start_date: string;
  application_end_date: string;
  application_fee: number;
  admission_fee: number;
  max_applications: number;
  is_open: boolean;
  days_until_close: number;
  status: string;
  program?: {
    id: number;
    name: string;
    code: string;
    degree_type: string;
    duration_years: number;
  };
  college?: {
    id: number;
    name: string;
    short_name: string;
  };
  academic_year?: {
    id: number;
    year_label: string;
  };
}

const STEPS = [
  { label: "Select Admission", icon: Calendar, color: "from-purple-500 to-purple-600" },
  { label: "Personal Info", icon: User, color: "from-blue-500 to-blue-600" },
  { label: "Academic Info", icon: BookOpen, color: "from-green-500 to-green-600" },
  { label: "Course Select", icon: Layers, color: "from-orange-500 to-orange-600" },
  { label: "Review & Submit", icon: FileCheck, color: "from-primary-600 to-primary-700" },
];

export default function Apply() {
  const navigate = useNavigate();

  const [applicantInfo] = useState<ApplicantInfo>({
    application_id: sessionStorage.getItem("registeredApplicantId") || "",
    email: sessionStorage.getItem("registeredEmail") || "",
    phone: sessionStorage.getItem("registeredPhone") || "",
    first_name: sessionStorage.getItem("registeredFirstName") || "",
    last_name: sessionStorage.getItem("registeredLastName") || "",
  });

  const [step, setStep] = useState(0);
  const [colleges, setColleges] = useState<College[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [cycles, setCycles] = useState<AdmissionCycle[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<AdmissionCycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [admissionsOpen, setAdmissionsOpen] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [appId, setAppId] = useState<string | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"apply" | "status">("apply");
  const [statusAppId, setStatusAppId] = useState(applicantInfo.application_id);
  const [statusEmail, setStatusEmail] = useState(applicantInfo.email);
  const [statusResult, setStatusResult] = useState<any>(null);
  const [statusError, setStatusError] = useState("");
  const [savingDraft, setSavingDraft] = useState(false);

  // Payment related states - NOW PROPERLY PLACED
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [razorpayOrder, setRazorpayOrder] = useState<any>(null);
  const [paymentError, setPaymentError] = useState("");
  const [showBankDetails, setShowBankDetails] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // Redirect to register if no applicant info
  useEffect(() => {
    if (!applicantInfo.application_id) {
      toast.error("Please complete registration first");
      navigate("/register");
    }
  }, [applicantInfo.application_id, navigate]);

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    setValue,
    reset,
    getValues,
    formState: { errors },
  } = useForm<ApplyForm>();

  const selectedCollege = watch("college_id");
  const selectedCourseId = watch("course_id");
  const selectedCycleId = watch("cycle_id");
  const formValues = getValues();

  const filteredCourses = courses.filter(
    (c) => c.college_id === Number(selectedCollege)
  );

  // Pre-fill applicant info
  useEffect(() => {
    if (applicantInfo.first_name) setValue("first_name", applicantInfo.first_name);
    if (applicantInfo.last_name) setValue("last_name", applicantInfo.last_name);
    if (applicantInfo.email) setValue("email", applicantInfo.email);
    if (applicantInfo.phone) setValue("phone", applicantInfo.phone);
  }, []);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        if (applicantInfo.application_id) {
          try {
            const statusRes = await api.get(
              `/auth/application-status?application_id=${applicantInfo.application_id}&email=${applicantInfo.email}`
            );
            const appStatus = statusRes.data.data?.status;
            if (appStatus && appStatus !== "draft") {
              setSubmitted(true);
              setAppId(applicantInfo.application_id);
              setApplicationStatus(appStatus);
              toast.success(`Your application is ${appStatus.replace("_", " ")}`);
            }
          } catch (err) { }
        }

        const [cyclesRes, collegesRes, coursesRes] = await Promise.all([
          api.get("/admissions/active-cycle"),
          api.get("/colleges"),
          api.get("/courses"),
        ]);

        const cyclesData = cyclesRes.data.data?.cycles || [];
        const hasOpen = cyclesRes.data.data?.has_open || false;

        setCycles(cyclesData);
        setColleges(collegesRes.data.data || []);
        setCourses(coursesRes.data.data || []);
        setAdmissionsOpen(hasOpen);
      } catch (err) {
        console.error("Failed to load data:", err);
        setAdmissionsOpen(false);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [applicantInfo.application_id, applicantInfo.email]);

  // Load draft
  const loadDraft = useCallback(
    async (cycleId: number) => {
      if (!applicantInfo.application_id || !cycleId || draftLoaded) return;
      try {
        const res = await api.get(
          `/admissions/draft?application_id=${applicantInfo.application_id}&cycle_id=${cycleId}`
        );
        if (res.data.data?.has_draft) {
          const draftData = JSON.parse(res.data.data.draft_data);
          delete draftData.email;
          delete draftData.phone;
          reset({ ...draftData, email: applicantInfo.email, phone: applicantInfo.phone });
          setDraftLoaded(true);
          toast.success("Previous draft loaded", { duration: 2000 });
        }
      } catch (err) { }
    },
    [reset, draftLoaded, applicantInfo.application_id, applicantInfo.email, applicantInfo.phone]
  );

  // Save draft
  const saveDraft = useCallback(async () => {
    if (!selectedCycleId) return;

    const currentValues = getValues();
    const requiredFields = ["first_name", "last_name"];
    const hasRequired = requiredFields.every((field) => currentValues[field as keyof ApplyForm]);

    if (!hasRequired) return;

    setSavingDraft(true);
    try {
      await api.post("/admissions/draft", {
        application_id: applicantInfo.application_id,
        email: applicantInfo.email,
        cycle_id: Number(selectedCycleId),
        draft_data: JSON.stringify(currentValues),
        program_id: Number(currentValues.course_id || 0),
        college_id: Number(currentValues.college_id || 0),
      });
      toast.success("Progress saved", { duration: 1500 });
    } catch (err) {
      console.error("Auto-save failed:", err);
    } finally {
      setSavingDraft(false);
    }
  }, [selectedCycleId, getValues, applicantInfo.application_id, applicantInfo.email]);

  // Auto-save on form change (debounced)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (step > 0 && selectedCycleId && draftLoaded) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveDraft();
      }, 3000);
    }
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [formValues, saveDraft, step, selectedCycleId, draftLoaded]);

  const stepFields: (keyof ApplyForm)[][] = [
    ["cycle_id"],
    ["first_name", "last_name", "dob", "gender", "address", "city", "state", "pin_code", "category"],
    ["previous_school", "previous_grade", "statement"],
    ["college_id", "course_id"],
  ];

  const nextStep = async () => {
    const valid = await trigger(stepFields[step]);
    if (!valid) return;

    await saveDraft();

    if (step === 0 && selectedCycleId) {
      const cycle = cycles.find((c) => c.id === selectedCycleId);
      setSelectedCycle(cycle || null);
    }
    setStep((s) => s + 1);
  };

  const onSubmit = async (data: ApplyForm) => {
    if (!selectedCycle) {
      toast.error("Please select an admission cycle");
      return;
    }
    if (!applicantInfo.application_id) {
      toast.error("Please complete registration first");
      navigate("/register");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        application_id: applicantInfo.application_id,
        cycle_id: Number(data.cycle_id),
        program_id: Number(data.course_id),
        college_id: Number(data.college_id),
        first_name: data.first_name,
        last_name: data.last_name,
        email: applicantInfo.email,
        phone: applicantInfo.phone,
        dob: data.dob,
        gender: data.gender,
        category: data.category,
        address: data.address,
        city: data.city,
        state: data.state,
        pin_code: data.pin_code,
        previous_school: data.previous_school,
        previous_grade: data.previous_grade,
        statement: data.statement,
      };

      const res = await api.post("/applications/public/submit", payload);
      setSubmitted(true);
      setAppId(res.data.data.application_id);
      toast.success("Application submitted successfully!");
    } catch (err: any) {
      console.error("SUBMIT ERROR:", err?.response?.data);
      toast.error(
        err?.response?.data?.error || err?.response?.data?.message || "Submission failed"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Payment handlers - NOW PROPERLY PLACED
  const handlePayNow = async () => {
    setShowPaymentModal(true);
    setShowBankDetails(false);
    setPaymentError("");
  };

  const handleOnlinePayment = async () => {
    setPaymentLoading(true);
    setPaymentError("");
    try {
      const res = await api.post("/applications/fee/initiate", {
        application_id: applicantInfo.application_id,
      });
      setRazorpayOrder(res.data.data);
      setPaymentLoading(false);

      const options = {
        key: res.data.data.key_id,
        amount: res.data.data.amount,
        currency: res.data.data.currency,
        name: "University Application Fee",
        description: "Application Fee Payment",
        order_id: res.data.data.order_id,
        handler: async function (response: any) {
          try {
            await api.post("/applications/fee/verify", {
              application_id: applicantInfo.application_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success("Payment successful!");
            setShowPaymentModal(false);
            navigate("/payment/success");
          } catch (err: any) {
            setPaymentError("Payment verification failed");
          }
        },
        prefill: {
          name: `${formValues.first_name} ${formValues.last_name}`,
          email: applicantInfo.email,
          contact: applicantInfo.phone,
        },
        theme: { color: "#650C08" },
        modal: {
          ondismiss: () => setShowPaymentModal(false),
        },
      };

      // @ts-ignore
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setPaymentError(err?.response?.data?.error || "Failed to initiate payment");
      setPaymentLoading(false);
    }
  };

  const handleOfflinePayment = () => {
    setShowBankDetails(true);
  };

  const handleCheckStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusError("");
    setStatusResult(null);
    try {
      const res = await api.get(
        `/auth/application-status?application_id=${statusAppId}&email=${statusEmail}`
      );
      setStatusResult(res.data.data);
      toast.success("Status found!");
    } catch (err: any) {
      setStatusError(err.response?.data?.error || "Application not found");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      draft: { color: "bg-gray-100 text-gray-700", icon: <Clock className="w-4 h-4" />, label: "Draft" },
      submitted: {
        color: "bg-blue-100 text-blue-700",
        icon: <Send className="w-4 h-4" />,
        label: "Submitted",
      },
      payment_pending: {
        color: "bg-yellow-100 text-yellow-700",
        icon: <CreditCard className="w-4 h-4" />,
        label: "Payment Pending",
      },
      under_review: {
        color: "bg-purple-100 text-purple-700",
        icon: <RefreshCw className="w-4 h-4" />,
        label: "Under Review",
      },
      shortlisted: {
        color: "bg-green-100 text-green-700",
        icon: <CheckCircle className="w-4 h-4" />,
        label: "Shortlisted",
      },
      rejected: {
        color: "bg-red-100 text-red-700",
        icon: <XCircle className="w-4 h-4" />,
        label: "Rejected",
      },
      enrolled: {
        color: "bg-emerald-100 text-emerald-700",
        icon: <Award className="w-4 h-4" />,
        label: "Enrolled",
      },
    };
    return statusMap[status] || statusMap.draft;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading application form...</p>
        </div>
      </div>
    );
  }

  const hasExistingApplication = !!applicantInfo.application_id && applicationStatus === "draft";

  if (!admissionsOpen && !loading && !hasExistingApplication && !submitted) {
    const upcomingCycle = cycles.find((c) => c.status === "upcoming");
    const isUpcoming = !!upcomingCycle;

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div
            className={`w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-6 ${isUpcoming ? "bg-blue-100" : "bg-amber-100"
              }`}
          >
            <Clock
              className={`w-12 h-12 ${isUpcoming ? "text-blue-600" : "text-amber-600"}`}
            />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isUpcoming ? "Coming Soon" : "Admissions Closed"}
          </h2>
          <p className="text-gray-500 mb-6">
            {isUpcoming
              ? `Admissions for ${upcomingCycle?.name} will open on ${formatDate(
                upcomingCycle?.application_start_date
              )}`
              : "Currently, no admissions are open. Please check back later."}
          </p>

          {isUpcoming && upcomingCycle && (
            <div className="bg-blue-50 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm font-semibold text-blue-900 mb-2">📅 Important Dates</p>
              <p className="text-sm text-blue-800">
                Opens: {formatDate(upcomingCycle.application_start_date)}
              </p>
              <p className="text-sm text-blue-800">
                Closes: {formatDate(upcomingCycle.application_end_date)}
              </p>
              {upcomingCycle.application_fee > 0 && (
                <p className="text-sm text-blue-800 mt-2">
                  Application Fee: ₹{upcomingCycle.application_fee.toLocaleString()}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setViewMode("status")}
              className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all"
            >
              Track Application
            </button>
            <Link
              to="/register"
              className={`flex-1 py-2.5 font-semibold rounded-xl transition-all text-center ${isUpcoming
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-primary-600 text-white hover:bg-primary-700"
                }`}
            >
              {isUpcoming ? "Pre-Register" : "Go Back"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div
            className={`w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-6 ${applicationStatus === "enrolled"
                ? "bg-green-100"
                : applicationStatus === "shortlisted"
                  ? "bg-blue-100"
                  : applicationStatus === "rejected"
                    ? "bg-red-100"
                    : "bg-primary-100"
              }`}
          >
            {applicationStatus === "enrolled" ? (
              <Award className="w-12 h-12 text-green-600" />
            ) : applicationStatus === "shortlisted" ? (
              <CheckCircle className="w-12 h-12 text-blue-600" />
            ) : applicationStatus === "rejected" ? (
              <XCircle className="w-12 h-12 text-red-600" />
            ) : (
              <CheckCircle className="w-12 h-12 text-primary-600" />
            )}
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {applicationStatus === "enrolled"
              ? "Welcome to S University! 🎓"
              : applicationStatus === "shortlisted"
                ? "Congratulations! You're Shortlisted 🎉"
                : applicationStatus === "rejected"
                  ? "Application Status Update"
                  : "Application Submitted Successfully!"}
          </h2>

          <p className="text-gray-500 mb-4">
            {applicationStatus === "enrolled"
              ? "You have been successfully enrolled."
              : applicationStatus === "shortlisted"
                ? "Please check your email for next steps."
                : applicationStatus === "rejected"
                  ? "We appreciate your interest."
                  : "Your application has been submitted successfully."}
          </p>

          <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-4 mb-6">
            <p className="text-xs text-gray-600">Application ID</p>
            <p className="text-xl font-mono font-bold text-primary-700 mt-1">{appId}</p>
          </div>

          {(selectedCycle?.application_fee ?? 0) > 0 && applicationStatus !== "enrolled" && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 text-amber-700 mb-2">
                <IndianRupee className="w-4 h-4" />
                <span className="font-semibold">Payment Required</span>
              </div>
              <p className="text-amber-700 text-sm">
                Application Fee: ₹{selectedCycle?.application_fee?.toLocaleString()}
              </p>
              <button
                className="mt-3 w-full py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-all"
                onClick={handlePayNow}
              >
                Pay Now
              </button>
              <Modal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                title="Choose Payment Method"
              >
                {paymentError && <div className="mb-3 text-red-600 text-sm">{paymentError}</div>}
                {!showBankDetails ? (
                  <div className="space-y-4">
                    <button
                      className="w-full py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-all disabled:opacity-50"
                      onClick={handleOnlinePayment}
                      disabled={paymentLoading}
                    >
                      {paymentLoading ? "Processing..." : "Pay Online (Razorpay)"}
                    </button>
                    <button
                      className="w-full py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-all disabled:opacity-50"
                      onClick={handleOfflinePayment}
                      disabled={paymentLoading}
                    >
                      Pay Offline (Bank Branch)
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-center">
                      <CreditCard className="w-10 h-10 text-amber-600 mx-auto mb-2" />
                      <p className="font-bold text-lg text-amber-700 mb-1">
                        Offline Payment Instructions
                      </p>
                      <p className="text-gray-700 text-sm mb-2">
                        Visit your nearest bank branch and pay the application fee using the
                        details below:
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 text-left">
                      <div className="mb-1">
                        <span className="font-semibold">Bank Name:</span> {BANK_DETAILS.name}
                      </div>
                      <div className="mb-1">
                        <span className="font-semibold">Account Number:</span>{" "}
                        {BANK_DETAILS.account}
                      </div>
                      <div className="mb-1">
                        <span className="font-semibold">IFSC:</span> {BANK_DETAILS.ifsc}
                      </div>
                      <div className="mb-1">
                        <span className="font-semibold">Branch:</span> {BANK_DETAILS.branch}
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        After payment, submit the receipt to the admissions office for verification.
                      </div>
                    </div>
                  </div>
                )}
              </Modal>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Link
              to="/applicant/dashboard"
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              View Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setViewMode("status")}
              className="text-primary-600 hover:text-primary-700 text-sm"
            >
              Track Status
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#650C08] to-[#8B1A14] text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <GraduationCap className="w-6 h-6 text-[#650C08]" />
              </div>
              <div>
                <p className="font-bold text-sm">S University</p>
                <p className="text-rose-200 text-xs">Admissions Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {savingDraft && (
                <div className="flex items-center gap-1 text-xs text-rose-200">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Saving...</span>
                </div>
              )}
              <Link to="/login" className="text-sm text-rose-200 hover:text-white transition-colors">
                Sign In
              </Link>
              <button
                onClick={() => setViewMode(viewMode === "apply" ? "status" : "apply")}
                className="text-sm font-semibold bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl transition-all"
              >
                {viewMode === "apply" ? "Check Status" : "Apply Now"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {viewMode === "apply"
              ? "🎓 Student Admission Application"
              : "📋 Check Application Status"}
          </h1>
          <p className="text-gray-500 mt-2">
            {viewMode === "apply"
              ? "Complete all steps carefully • Auto-saves your progress"
              : "Track your application progress"}
          </p>
        </div>

        {viewMode === "status" && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Track Your Application</h2>
              <p className="text-gray-500 text-sm mt-1">Enter your credentials to view status</p>
            </div>

            <form onSubmit={handleCheckStatus} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Application ID
                </label>
                <div className="relative">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={statusAppId}
                    onChange={(e) => setStatusAppId(e.target.value.toUpperCase())}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                    placeholder="APP-2026-XXXX"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={statusEmail}
                    onChange={(e) => setStatusEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-xl transition-all shadow-lg"
              >
                Track Status
              </button>
            </form>

            {statusError && (
              <div className="mt-6 p-4 bg-red-50 rounded-xl text-red-700 text-sm text-center border border-red-200">
                {statusError}
              </div>
            )}

            {statusResult && (
              <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                <div className="text-center mb-4">
                  <div
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${getStatusBadge(statusResult.status).color
                      }`}
                  >
                    {getStatusBadge(statusResult.status).icon}
                    <span>{getStatusBadge(statusResult.status).label}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-500">Applicant</span>
                    <span className="font-semibold">
                      {statusResult.first_name} {statusResult.last_name}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-500">Program</span>
                    <span className="font-semibold">{statusResult.program?.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-500">College</span>
                    <span className="font-semibold">{statusResult.college?.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-500">Applied On</span>
                    <span className="font-semibold">
                      {statusResult.submitted_at
                        ? formatDate(statusResult.submitted_at)
                        : "N/A"}
                    </span>
                  </div>
                </div>

                {statusResult.remarks && (
                  <div className="mt-4 p-3 bg-white rounded-lg text-sm text-gray-700 border border-gray-200">
                    <strong>📝 Remarks:</strong> {statusResult.remarks}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {viewMode === "apply" && (
          <>
            {/* Step Indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                {STEPS.map(({ label, icon: Icon, color }, i) => {
                  const isDone = i < step;
                  const isActive = i === step;
                  return (
                    <Fragment key={i}>
                      <div className="flex flex-col items-center">
                        <div
                          className={`
                          w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300
                          ${isDone
                              ? `bg-gradient-to-r ${color} text-white shadow-md`
                              : isActive
                                ? `bg-gradient-to-r ${color} text-white shadow-lg scale-110`
                                : "bg-gray-100 text-gray-400 border-2 border-gray-200"
                            }
                        `}
                        >
                          {isDone ? (
                            <CheckCircle className="w-6 h-6" />
                          ) : (
                            <Icon className="w-6 h-6" />
                          )}
                        </div>
                        <span
                          className={`text-xs font-semibold mt-2 transition-colors duration-300 hidden sm:block
                          ${isActive ? "text-primary-600" : "text-gray-500"}`}
                        >
                          {label}
                        </span>
                      </div>
                      {i < STEPS.length - 1 && (
                        <div
                          className={`flex-1 h-0.5 mx-2 transition-all duration-300
                          ${i < step
                              ? "bg-gradient-to-r from-green-500 to-green-600"
                              : "bg-gray-200"
                            }`}
                        />
                      )}
                    </Fragment>
                  );
                })}
              </div>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="p-8">
                  {/* STEP 0 - Select Admission Cycle */}
                  {step === 0 && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">
                            Select Admission Cycle
                          </h2>
                          <p className="text-gray-500 text-sm">
                            Choose the admission cycle you want to apply for
                          </p>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <ShieldCheck className="w-5 h-5 text-green-600" />
                          <span className="text-sm font-semibold text-green-700">
                            Verified Applicant
                          </span>
                        </div>
                        <p className="text-green-800 font-medium">
                          {applicantInfo.first_name} {applicantInfo.last_name}
                        </p>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-green-700">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {applicantInfo.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {applicantInfo.phone}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Select Admission Cycle *
                        </label>
                        <select
                          {...register("cycle_id", {
                            required: "Please select an admission cycle",
                            valueAsNumber: true,
                          })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                          onChange={(e) => {
                            const cycleId = Number(e.target.value);
                            if (cycleId) {
                              const cycle = cycles.find((c) => c.id === cycleId);
                              setSelectedCycle(cycle || null);
                              if (applicantInfo.application_id) loadDraft(cycleId);
                            }
                          }}
                        >
                          <option value="">— Select an open admission cycle —</option>
                          {cycles
                            .filter((c) => c.status === "open" || c.status === "upcoming")
                            .map((cycle) => (
                              <option
                                key={cycle.id}
                                value={cycle.id}
                                disabled={cycle.status !== "open"}
                              >
                                {cycle.name}
                                {cycle.status === "open"
                                  ? ` (Open - ${cycle.days_until_close} days left)`
                                  : ` (Opens ${formatDate(cycle.application_start_date)})`}
                                {cycle.application_fee > 0
                                  ? ` • Fee: ₹${cycle.application_fee.toLocaleString()}`
                                  : ""}
                              </option>
                            ))}
                        </select>
                        {errors.cycle_id && (
                          <p className="text-red-500 text-xs mt-1">{errors.cycle_id.message}</p>
                        )}
                      </div>

                      {selectedCycle && (
                        <div
                          className={`rounded-xl p-5 ${selectedCycle.status === "open"
                              ? "bg-green-50 border border-green-200"
                              : "bg-blue-50 border border-blue-200"
                            }`}
                        >
                          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                            <h3
                              className={`font-bold ${selectedCycle.status === "open"
                                  ? "text-green-900"
                                  : "text-blue-900"
                                }`}
                            >
                              {selectedCycle.name}
                            </h3>
                            <span
                              className={`text-xs px-3 py-1 rounded-full font-semibold ${selectedCycle.status === "open"
                                  ? "bg-green-200 text-green-800"
                                  : "bg-blue-200 text-blue-800"
                                }`}
                            >
                              {selectedCycle.status === "open"
                                ? `⏰ ${selectedCycle.days_until_close} days left`
                                : "📅 Upcoming"}
                            </span>
                          </div>
                          <p className="text-sm mb-3">{selectedCycle.description}</p>
                          <div className="flex flex-wrap gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Application Fee:</span>{" "}
                              <strong>₹{selectedCycle.application_fee?.toLocaleString()}</strong>
                            </div>
                            <div>
                              <span className="text-gray-600">Admission Fee:</span>{" "}
                              <strong>₹{selectedCycle.admission_fee?.toLocaleString()}</strong>
                            </div>
                          </div>
                          {selectedCycle.status === "open" &&
                            selectedCycle.days_until_close <= 7 && (
                              <div className="mt-3 bg-amber-100 text-amber-800 text-xs p-2 rounded-lg flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" /> Hurry! Only{" "}
                                {selectedCycle.days_until_close} days left to apply.
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* STEP 1 - Personal Info */}
                  {step === 1 && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                          <User className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
                          <p className="text-gray-500 text-sm">Tell us about yourself</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            First Name *
                          </label>
                          <input
                            {...register("first_name", { required: "Required" })}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                            placeholder="John"
                          />
                          {errors.first_name && (
                            <p className="text-red-500 text-xs mt-1">{errors.first_name.message}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Last Name *
                          </label>
                          <input
                            {...register("last_name", { required: "Required" })}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                            placeholder="Doe"
                          />
                          {errors.last_name && (
                            <p className="text-red-500 text-xs mt-1">{errors.last_name.message}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Date of Birth *
                          </label>
                          <input
                            {...register("dob", { required: "Required" })}
                            type="date"
                            max={new Date().toISOString().split("T")[0]}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                          />
                          {errors.dob && (
                            <p className="text-red-500 text-xs mt-1">{errors.dob.message}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Gender *
                          </label>
                          <select
                            {...register("gender", { required: "Required" })}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                          >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                          {errors.gender && (
                            <p className="text-red-500 text-xs mt-1">{errors.gender.message}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Category *
                          </label>
                          <select
                            {...register("category", { required: "Required" })}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                          >
                            <option value="">Select Category</option>
                            <option value="General">General</option>
                            <option value="OBC">OBC</option>
                            <option value="SC">SC</option>
                            <option value="ST">ST</option>
                            <option value="EWS">EWS</option>
                          </select>
                          {errors.category && (
                            <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>
                          )}
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Address *
                          </label>
                          <input
                            {...register("address", { required: "Required" })}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                            placeholder="123 Main Street"
                          />
                          {errors.address && (
                            <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            City
                          </label>
                          <input
                            {...register("city")}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                            placeholder="Mumbai"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            State
                          </label>
                          <select
                            {...register("state", { required: "State is required" })}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                          >
                            <option value="">Select State</option>
                            <option value="Andhra Pradesh">Andhra Pradesh</option>
                            <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                            <option value="Assam">Assam</option>
                            <option value="Bihar">Bihar</option>
                            <option value="Chhattisgarh">Chhattisgarh</option>
                            <option value="Goa">Goa</option>
                            <option value="Gujarat">Gujarat</option>
                            <option value="Haryana">Haryana</option>
                            <option value="Himachal Pradesh">Himachal Pradesh</option>
                            <option value="Jharkhand">Jharkhand</option>
                            <option value="Karnataka">Karnataka</option>
                            <option value="Kerala">Kerala</option>
                            <option value="Madhya Pradesh">Madhya Pradesh</option>
                            <option value="Maharashtra">Maharashtra</option>
                            <option value="Manipur">Manipur</option>
                            <option value="Meghalaya">Meghalaya</option>
                            <option value="Mizoram">Mizoram</option>
                            <option value="Nagaland">Nagaland</option>
                            <option value="Odisha">Odisha</option>
                            <option value="Punjab">Punjab</option>
                            <option value="Rajasthan">Rajasthan</option>
                            <option value="Sikkim">Sikkim</option>
                            <option value="Tamil Nadu">Tamil Nadu</option>
                            <option value="Telangana">Telangana</option>
                            <option value="Tripura">Tripura</option>
                            <option value="Uttar Pradesh">Uttar Pradesh</option>
                            <option value="Uttarakhand">Uttarakhand</option>
                            <option value="West Bengal">West Bengal</option>
                            <option value="Delhi">Delhi</option>
                            <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                            <option value="Ladakh">Ladakh</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Pin Code
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            {...register("pin_code", {
                              required: "Required",
                              pattern: {
                                value: /^[0-9]{6}$/,
                                message: "Must be 6 digits",
                              },
                            })}
                            onInput={(e) =>
                            (e.currentTarget.value = e.currentTarget.value
                              .replace(/\D/g, "")
                              .slice(0, 6))
                            }
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Mail className="w-4 h-4" /> Email: <strong>{applicantInfo.email}</strong>
                        </p>
                        {applicantInfo.phone && (
                          <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                            <Phone className="w-4 h-4" /> Phone: <strong>{applicantInfo.phone}</strong>
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          Contact info verified during registration
                        </p>
                      </div>
                    </div>
                  )}

                  {/* STEP 2 - Academic Info */}
                  {step === 2 && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">Academic Information</h2>
                          <p className="text-gray-500 text-sm">Share your educational background</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-5">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Previous School / College *
                          </label>
                          <input
                            {...register("previous_school", { required: "Required" })}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                            placeholder="City High School"
                          />
                          {errors.previous_school && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors.previous_school.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Final Grade / Percentage *
                          </label>
                          <input
                            {...register("previous_grade", { required: "Required" })}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                            placeholder="85% or A+"
                          />
                          {errors.previous_grade && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors.previous_grade.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Personal Statement *
                          </label>
                          <textarea
                            {...register("statement", { required: "Required" })}
                            rows={6}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all resize-none"
                            placeholder="Tell us about yourself, your goals, and why you want to join this program..."
                          />
                          {errors.statement && (
                            <p className="text-red-500 text-xs mt-1">{errors.statement.message}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 3 - Course Selection */}
                  {step === 3 && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center">
                          <Layers className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">Course Selection</h2>
                          <p className="text-gray-500 text-sm">
                            Choose your preferred college and course
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Select College *
                        </label>
                        <select
                          {...register("college_id", {
                            required: "Required",
                            valueAsNumber: true,
                          })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                        >
                          <option value="">— Choose a college —</option>
                          {colleges.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.code})
                            </option>
                          ))}
                        </select>
                        {errors.college_id && (
                          <p className="text-red-500 text-xs mt-1">{errors.college_id.message}</p>
                        )}
                      </div>

                      {selectedCollege && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Select Course *
                          </label>
                          {filteredCourses.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-xl">
                              No courses available for this college
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 gap-3">
                              {filteredCourses.map((c) => {
                                const available = c.total_seats;
                                const isSelected = Number(selectedCourseId) === c.id;
                                return (
                                  <label
                                    key={c.id}
                                    className={`flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${isSelected
                                        ? "border-primary-500 bg-primary-50 shadow-sm"
                                        : "border-gray-200 hover:border-primary-300 hover:bg-gray-50"
                                      }`}
                                  >
                                    <input
                                      {...register("course_id", {
                                        required: "Please select a course",
                                        valueAsNumber: true,
                                      })}
                                      type="radio"
                                      value={c.id}
                                      className="mt-1 accent-primary-600"
                                    />
                                    <div className="flex-1">
                                      <p className="font-semibold text-gray-900">{c.name}</p>
                                      <p className="text-xs text-gray-500 mt-0.5">
                                        {c.code} • {c.duration_years} Years
                                      </p>
                                      <span
                                        className={`text-xs font-medium mt-1 inline-block ${available > 10
                                            ? "text-green-600"
                                            : available > 0
                                              ? "text-yellow-600"
                                              : "text-red-500"
                                          }`}
                                      >
                                        {available > 0
                                          ? `${available} seats available`
                                          : "No seats available"}
                                      </span>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                          {errors.course_id && (
                            <p className="text-red-500 text-xs mt-2">{errors.course_id.message}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* STEP 4 - Review */}
                  {step === 4 && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center">
                          <FileCheck className="w-6 h-6 text-primary-600" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">Review Application</h2>
                          <p className="text-gray-500 text-sm">Verify all details before submitting</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          [
                            "Full Name",
                            `${formValues.first_name} ${formValues.last_name}`,
                          ],
                          ["Date of Birth", formValues.dob],
                          ["Gender", formValues.gender],
                          ["Category", formValues.category],
                          ["Phone", formValues.phone],
                          ["Email", formValues.email],
                          [
                            "Address",
                            `${formValues.address}${formValues.city ? ", " + formValues.city : ""
                            }`,
                          ],
                          ["State", formValues.state],
                          ["Pin Code", formValues.pin_code],
                          ["Previous School", formValues.previous_school],
                          ["Previous Grade", formValues.previous_grade],
                          ["Selected Cycle", selectedCycle?.name || "N/A"],
                          [
                            "Selected College",
                            colleges.find((c) => c.id === Number(formValues.college_id))
                              ?.name || "N/A",
                          ],
                          [
                            "Selected Course",
                            courses.find((c) => c.id === Number(formValues.course_id))
                              ?.name || "N/A",
                          ],
                        ].map(([label, value]) => (
                          <div key={label} className="bg-gray-50 p-3 rounded-xl">
                            <p className="text-gray-400 text-xs">{label}</p>
                            <p className="font-semibold text-gray-900 mt-0.5 break-words">
                              {value || "—"}
                            </p>
                          </div>
                        ))}
                      </div>

                      {formValues.statement && (
                        <div className="bg-gray-50 p-4 rounded-xl">
                          <p className="text-gray-400 text-xs mb-1">Personal Statement</p>
                          <p className="text-gray-700 text-sm leading-relaxed">
                            {formValues.statement}
                          </p>
                        </div>
                      )}

                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-amber-700 text-sm font-semibold">
                            Important Notes:
                          </p>
                          <ul className="text-amber-700 text-xs mt-1 list-disc list-inside">
                            <li>Please review all details carefully before submitting</li>
                            <li>Once submitted, changes cannot be made</li>
                            {(selectedCycle?.application_fee ?? 0) > 0 && (
                              <li>
                                Application fee of ₹
                                {selectedCycle?.application_fee?.toLocaleString()} is required
                                after submission
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setStep((s) => s - 1)}
                      disabled={step === 0}
                      className="px-6 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <ChevronLeft className="w-4 h-4" /> Previous
                    </button>

                    {step < STEPS.length - 1 ? (
                      <button
                        type="button"
                        onClick={nextStep}
                        className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-md flex items-center gap-2"
                      >
                        Next <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-md flex items-center gap-2 disabled:opacity-70"
                      >
                        {submitting ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        {submitting ? "Submitting..." : "Submit Application"}
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}