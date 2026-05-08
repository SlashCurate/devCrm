import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail, Phone, ArrowRight, CheckCircle, RefreshCw,
  Smartphone, FileText, Clock, User, Sparkles,
  GraduationCap, CheckCheck, CalendarDays, MapPin, Search
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";


type Step = "contact" | "verify-email" | "verify-phone" | "success" | "continue" | "status";

interface RegistrationData {
  email: string;
  phone: string;
  emailOtp: string;
  phoneOtp: string;
  firstName: string;
  lastName: string;
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
  program: {
    name: string;
    code: string;
    degree_type: string;
    duration_years: number;
    total_seats: number;
  } | null;
  college: {
    name: string;
    short_name: string;
    city: string;
  } | null;
  academic_year: {
    year_label: string;
  } | null;
}

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("contact");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  const [admissionCycle, setAdmissionCycle] = useState<AdmissionCycle | null>(null);
  const [upcomingCycles, setUpcomingCycles] = useState<any[]>([]);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const [admissionsLoading, setAdmissionsLoading] = useState(true);

  const [statusAppId, setStatusAppId] = useState("");
  const [statusEmail, setStatusEmail] = useState("");
  const [statusData, setStatusData] = useState<any>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const [data, setData] = useState<RegistrationData>({
    email: "",
    phone: "",
    emailOtp: "",
    phoneOtp: "",
    firstName: "",
    lastName: "",
  });

  const [continueData, setContinueData] = useState({
    appId: "",
    email: "",
  });

  const rightPanelGradient = {
    backgroundColor: "#650C08",
    backgroundImage: [
      "radial-gradient(circle at 95% 5%, rgba(255,220,210,0.28) 0%, rgba(255,220,210,0.12) 12%, rgba(255,220,210,0.03) 28%, transparent 45%)",
      "linear-gradient(135deg, #7a1d16 0%, #650C08 35%, #b77a6f 100%)",
      "repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1.5px, transparent 1.5px, transparent 18px)"
    ].join(", "),
    backgroundBlendMode: "overlay, normal, normal" as const,
  };

  useEffect(() => {
    const checkAdmissions = async () => {
      setAdmissionsLoading(true);
      try {
        const res = await api.get("/admissions/active-cycle");
        const responseData = res.data.data;

        if (responseData?.active_cycle) {
          const cycle = responseData.active_cycle;
          setAdmissionCycle({
            id: cycle.ID,
            name: cycle.Name,
            description: cycle.Description,
            application_start_date: cycle.ApplicationStartDate,
            application_end_date: cycle.ApplicationEndDate,
            application_fee: cycle.ApplicationFee,
            admission_fee: cycle.AdmissionFee,
            max_applications: cycle.MaxApplications,
            is_open: responseData.has_open || false,
            days_until_close: responseData.cycles?.[0]?.days_until_close || 0,
            status: responseData.cycles?.[0]?.status || "closed",
            program: cycle.Program ? {
              name: cycle.Program.name,
              code: cycle.Program.code,
              degree_type: cycle.Program.degree_type,
              duration_years: cycle.Program.duration_years,
              total_seats: cycle.Program.total_seats,
            } : null,
            college: cycle.College ? {
              name: cycle.College.name,
              short_name: cycle.College.short_name,
              city: cycle.College.city,
            } : null,
            academic_year: cycle.AcademicYear ? {
              year_label: cycle.AcademicYear.YearLabel,
            } : null,
          });
        }

        setUpcomingCycles(responseData?.cycles?.filter((c: any) => c.status === "upcoming") || []);
      } catch (err) {
        console.error("Failed to fetch admissions:", err);
        setAdmissionCycle(null);
      } finally {
        setAdmissionsLoading(false);
      }
    };
    checkAdmissions();
  }, []);

  useEffect(() => {
    const checkApplicationStatus = async () => {
      const existingAppId = sessionStorage.getItem("registeredApplicantId");
      const email = sessionStorage.getItem("registeredEmail");
      if (!existingAppId || !email) return;
      try {
        const res = await api.get(`/auth/application-status?application_id=${existingAppId}&email=${email}`);
        const status = res.data.data?.Status || res.data.data?.status || "draft";
        if (status.toLowerCase() !== "draft") setApplicationSubmitted(true);
      } catch (err) {
        console.error(err);
      }
    };
    checkApplicationStatus();
  }, [step]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleContinueToApply = () => {
    const appId = sessionStorage.getItem("registeredApplicantId");
    if (appId) navigate("/apply");
    else toast.error("No active application found");
  };

  const handleResumeApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!continueData.appId || !continueData.email) {
      toast.error("Please enter Application ID and Email");
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/auth/application-status?application_id=${continueData.appId}&email=${continueData.email}`);
      sessionStorage.setItem("registeredApplicantId", continueData.appId);
      sessionStorage.setItem("registeredEmail", continueData.email);
      sessionStorage.setItem("registeredPhone", res.data.data?.phone || "");
      sessionStorage.setItem("registeredFirstName", res.data.data?.first_name || "");
      sessionStorage.setItem("registeredLastName", res.data.data?.last_name || "");
      toast.success("Application found! Redirecting...");
      navigate("/apply");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Application not found");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtps = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.email || !data.phone) {
      toast.error("Email and Phone are required");
      return;
    }
    if (data.phone.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }
    setLoading(true);
    try {
      await Promise.all([
        api.post("/auth/send-otp", { email: data.email, type: "email" }),
        api.post("/auth/send-otp", { phone: data.phone, type: "phone" })
      ]);
      toast.success("OTPs sent successfully!");
      setStep("verify-email");
      setCountdown(60);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to send OTPs");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async (type: "email" | "phone") => {
    if (countdown > 0) {
      toast.error(`Please wait ${countdown} seconds`);
      return;
    }
    setResendLoading(true);
    try {
      if (type === "email") {
        await api.post("/auth/send-otp", { email: data.email, type: "email" });
        toast.success("Email OTP resent!");
      } else {
        await api.post("/auth/send-otp", { phone: data.phone, type: "phone" });
        toast.success("Phone OTP resent!");
      }
      setCountdown(60);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to resend OTP");
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (data.emailOtp.length !== 6) {
      toast.error("Enter 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/verify-otp", { email: data.email, otp: data.emailOtp, type: "email" });
      toast.success("Email verified successfully!");
      setStep("verify-phone");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (data.phoneOtp.length !== 6) {
      toast.error("Enter 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/verify-otp", { phone: data.phone, otp: data.phoneOtp, type: "phone" });
      const res = await api.post("/auth/register-applicant", {
        email: data.email,
        phone: data.phone,
        first_name: data.firstName,
        last_name: data.lastName,
      });
      toast.success("Registration successful!");
      sessionStorage.setItem("registeredEmail", data.email);
      sessionStorage.setItem("registeredPhone", data.phone);
      sessionStorage.setItem("registeredFirstName", data.firstName);
      sessionStorage.setItem("registeredLastName", data.lastName);
      sessionStorage.setItem("registeredApplicantId", res.data.data.applicant_id);
      setStep("success");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusLoading(true);
    setStatusData(null);
    try {
      const res = await api.get(`/auth/application-status?application_id=${statusAppId}&email=${statusEmail}`);
      setStatusData(res.data.data);
      toast.success("Status found!");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Application not found");
    } finally {
      setStatusLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const steps = [
    { id: "contact", label: "Personal Info", icon: User },
    { id: "verify-email", label: "Verify Email", icon: Mail },
    { id: "verify-phone", label: "Verify Phone", icon: Smartphone },
  ];

  const currentStepIndex = steps.findIndex(st => st.id === (step === "success" ? "verify-phone" : step));

  if (admissionsLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-[#650C08] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading admission details...</p>
        </div>
      </div>
    );
  }

  if (step === "status") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="w-full max-w-6xl min-h-[620px] rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row">
          <div className="w-full lg:w-[35%] bg-gray-100 flex flex-col items-center justify-center p-10 text-center">
            <div className="w-36 h-36 rounded-full overflow-hidden shadow-2xl border-8 border-white">
              <img src="/Logo.png" alt="S University" className="w-full h-full object-contain" />
            </div>
            <h1 className="mt-8 text-4xl font-bold text-gray-800 tracking-wide">S University</h1>
            <p className="mt-4 text-sm text-gray-500">Pacheri Bari, Jhunjhunu - 333515</p>
            <p className="text-sm text-gray-500">Rajasthan, India</p>
            <div className="mt-10 text-gray-600 font-medium">Application Status Portal</div>
          </div>

          <div className="w-full lg:w-[65%] flex flex-col justify-center p-8 lg:p-12 text-white" style={rightPanelGradient}>
            <div className="max-w-md mx-auto w-full">
              <h2 className="text-4xl font-extrabold text-rose-100 text-center mb-10">
                TRACK STATUS
              </h2>

              <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl text-gray-900">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Search className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Check Application Status</h3>
                  <p className="text-gray-500 text-sm mt-2">Enter your credentials to track your application</p>
                </div>

                <form onSubmit={checkStatus} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Application ID</label>
                    <div className="relative">
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={statusAppId}
                        onChange={(e) => setStatusAppId(e.target.value.toUpperCase())}
                        placeholder="APP-2026-XXXX"
                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        required
                        value={statusEmail}
                        onChange={(e) => setStatusEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={statusLoading}
                    className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    {statusLoading ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <>Check Status <ArrowRight className="w-5 h-5" /></>
                    )}
                  </button>
                </form>

                {statusData && (
                  <div className="mt-8 p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      </div>
                      <h4 className="text-xl font-bold text-gray-900">
                        {statusData.first_name} {statusData.last_name}
                      </h4>
                      <p className="text-gray-600 text-sm mt-1">{statusData.program?.name || "Application"}</p>
                      <div className="mt-4 inline-flex px-4 py-2 rounded-full text-sm font-bold bg-primary-100 text-primary-700">
                        {statusData.status?.toUpperCase() || "PENDING"}
                      </div>
                      {statusData.remarks && (
                        <p className="text-gray-600 text-sm mt-4 italic">"{statusData.remarks}"</p>
                      )}
                    </div>
                  </div>
                )}

                <button onClick={() => setStep("contact")} className="w-full text-primary-600 font-medium py-3 hover:text-primary-700 transition-colors mt-4">
                  ← Back to Registration
                </button>
              </div>

              <div className="mt-10 text-center text-sm opacity-90">
                <p>ERP • Powered by <span className="font-bold">SlashCurate Technologies Pvt Ltd</span></p>
                <p className="mt-2">© 2025 S University. All rights reserved.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!admissionCycle && upcomingCycles.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="w-full max-w-6xl min-h-[620px] rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row">
          <div className="w-full lg:w-[35%] bg-gray-100 flex flex-col items-center justify-center p-10 text-center">
            <div className="w-36 h-36 rounded-full overflow-hidden shadow-2xl border-8 border-white">
              <img src="/Logo.png" alt="S University" className="w-full h-full object-contain" />
            </div>
            <h1 className="mt-8 text-4xl font-bold text-gray-800 tracking-wide">S University</h1>
            <p className="mt-4 text-sm text-gray-500">Pacheri Bari, Jhunjhunu - 333515</p>
            <p className="text-sm text-gray-500">Rajasthan, India</p>
            <div className="mt-10 text-gray-600 font-medium">Admission Portal</div>
          </div>

          <div className="w-full lg:w-[65%] flex flex-col justify-center p-8 lg:p-12 text-white" style={rightPanelGradient}>
            <div className="max-w-md mx-auto w-full text-center">
              <div className="w-28 h-28 bg-amber-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Clock className="w-14 h-14 text-amber-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">Admissions Closed</h2>
              <p className="text-white/80 mb-8">No active admission cycles are available at this moment.</p>
              <button onClick={() => setStep("status")} className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-semibold transition-all">
                Track Your Application Status
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-6xl min-h-[620px] rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row">

        {/* LEFT PANEL - Enhanced */}
        <div className="w-full lg:w-[35%] bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-100/20 to-transparent rounded-full -mr-32 -mt-32"></div>

          <div className="relative z-10">
            <div className="w-32 h-32 rounded-2xl overflow-hidden shadow-xl bg-white p-3 mx-auto transform transition-transform hover:scale-105">
              <img src="/Logo.png" alt="S University" className="w-full h-full object-contain" />
            </div>
            <h1 className="mt-6 text-3xl font-bold text-gray-800">S University</h1>
            <div className="flex items-center justify-center gap-2 mt-2 text-gray-500 text-sm">
              <MapPin className="w-4 h-4" />
              <span>Jhunjhunu, Rajasthan</span>
            </div>

            {/* Active Cycle Info */}
            {admissionCycle && (
              <div className="mt-6 p-4 bg-white rounded-xl shadow-md border border-gray-200">
                <div className="flex items-center gap-2 text-amber-600 mb-2">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wide">Active Admission Cycle</span>
                </div>
                <h3 className="font-bold text-gray-800 text-base">{admissionCycle.name}</h3>
                {admissionCycle.program && (
                  <div className="flex items-center gap-1 mt-1 text-gray-600 text-xs">
                    <GraduationCap className="w-3 h-3" />
                    <span>{admissionCycle.program.name}</span>
                  </div>
                )}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Last Date:</span>
                    <span className="font-semibold text-red-600">{formatDate(admissionCycle.application_end_date)}</span>
                  </div>
                  {getDaysRemaining(admissionCycle.application_end_date) > 0 && (
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-gray-500">Days Left:</span>
                      <span className="font-bold text-amber-600">{getDaysRemaining(admissionCycle.application_end_date)} days</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-full lg:w-[65%] flex flex-col justify-center p-8 lg:p-12 text-white" style={rightPanelGradient}>
          <div className="max-w-md mx-auto w-full">
            <h2 className="text-4xl font-extrabold text-rose-100 text-center mb-8">
              NEW ADMISSION
            </h2>

            <div className="bg-white rounded-2xl shadow-2xl text-gray-900 overflow-hidden">
              <div className="p-6 lg:p-8">
                {/* Stepper */}
                {["contact", "verify-email", "verify-phone"].includes(step) && (
                  <div className="relative mb-8">
                    <div className="flex justify-between">
                      {steps.map((s, i) => {
                        const Icon = s.icon;
                        const isActive = step === s.id;
                        const isCompleted = currentStepIndex > i;
                        return (
                          <div key={s.id} className="flex flex-col items-center relative z-10">
                            <div className={`
                              w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300
                              ${isCompleted ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md" :
                                isActive ? "bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg scale-110" :
                                  "bg-gray-100 text-gray-400 border-2 border-gray-200"}
                            `}>
                              {isCompleted ? <CheckCircle className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                            </div>
                            <span className={`text-xs font-semibold mt-2 transition-colors duration-300
                              ${isActive ? "text-primary-600" : "text-gray-500"}`}>
                              {s.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-0">
                      <div
                        className="h-full bg-gradient-to-r from-primary-600 to-primary-700 transition-all duration-500"
                        style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* CONTACT STEP */}
                {step === "contact" && (
                  <form onSubmit={handleSendOtps} className="space-y-4">
                    {/* Last Date Banner */}
                    {admissionCycle && (
                      <div className="mb-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CalendarDays className="w-4 h-4 text-amber-600" />
                            <span className="text-xs font-semibold text-amber-700">Last Date to Apply:</span>
                          </div>
                          <span className="text-sm font-bold text-red-600">{formatDate(admissionCycle.application_end_date)}</span>
                        </div>
                      </div>
                    )}

                    {sessionStorage.getItem("registeredApplicantId") && !applicationSubmitted && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-blue-900 text-sm">Active Application Found</p>
                            <p className="text-xs text-blue-700 font-mono">{sessionStorage.getItem("registeredApplicantId")}</p>
                          </div>
                          <button type="button" onClick={handleContinueToApply} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all">Continue →</button>
                        </div>
                      </div>
                    )}

                    <div className="text-center mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <User className="w-8 h-8 text-primary-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">Create Account</h3>
                      <p className="text-gray-500 text-sm mt-1">Enter your details to begin your application</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">First Name</label>
                        <input
                          type="text"
                          required
                          value={data.firstName}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^a-zA-Z]/g, "");
                            setData({ ...data, firstName: value });
                          }}
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                          placeholder="John"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Last Name</label>
                        <input
                          type="text"
                          required
                          value={data.lastName}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^a-zA-Z]/g, "");
                            setData({ ...data, lastName: value });
                          }}
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                          placeholder="Doe"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="email"
                          required
                          value={data.email}
                          onChange={(e) => {
                            const value = e.target.value
                              .toLowerCase()
                              .replace(/\s/g, ""); // remove spaces

                            setData({ ...data, email: value });
                          }}
                          className="w-full pl-12 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Mobile Number</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={data.phone}
                          onChange={(e) => setData({ ...data, phone: e.target.value.replace(/\D/g, "") })}
                          className="w-full pl-12 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
                          placeholder="9876543210"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                    >
                      {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <>Continue <ArrowRight className="w-5 h-5" /></>}
                    </button>

                    <button
                      type="button"
                      onClick={() => setStep("continue")}
                      className="w-full text-primary-600 font-medium py-2 hover:text-primary-700 transition-colors text-sm"
                    >
                      Already have an Application ID? Resume Application →
                    </button>
                  </form>
                )}

                {/* VERIFY EMAIL */}
                {step === "verify-email" && (
                  <form onSubmit={handleVerifyEmailOtp} className="space-y-5">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-10 h-10 text-blue-600" />
                      </div>
                      <h3 className="text-2xl font-bold">Verify Email</h3>
                      <p className="text-gray-500 text-sm mt-2">
                        Enter 6-digit code sent to <br />
                        <span className="font-semibold text-gray-900">{data.email}</span>
                      </p>
                    </div>

                    <div>
                      <input
                        type="text"
                        maxLength={6}
                        value={data.emailOtp}
                        onChange={(e) => setData({ ...data, emailOtp: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                        className="w-full text-center text-3xl font-mono font-bold tracking-[0.3em] py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                        placeholder="000000"
                        autoFocus
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading || data.emailOtp.length !== 6}
                      className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all disabled:opacity-50"
                    >
                      {loading ? "Verifying..." : "Verify Email"}
                    </button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => handleResendOtp("email")}
                        disabled={resendLoading || countdown > 0}
                        className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50 font-medium"
                      >
                        {countdown > 0 ? `Resend OTP in ${countdown}s` : "Resend OTP"}
                      </button>
                    </div>
                  </form>
                )}

                {/* VERIFY PHONE */}
                {step === "verify-phone" && (
                  <form onSubmit={handleVerifyPhoneOtp} className="space-y-5">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Smartphone className="w-10 h-10 text-green-600" />
                      </div>
                      <h3 className="text-2xl font-bold">Verify Phone</h3>
                      <p className="text-gray-500 text-sm mt-2">
                        Enter 6-digit code sent to <br />
                        <span className="font-semibold text-gray-900">+91 {data.phone}</span>
                      </p>
                    </div>

                    <div>
                      <input
                        type="text"
                        maxLength={6}
                        value={data.phoneOtp}
                        onChange={(e) => setData({ ...data, phoneOtp: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                        className="w-full text-center text-3xl font-mono font-bold tracking-[0.3em] py-4 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                        placeholder="000000"
                        autoFocus
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading || data.phoneOtp.length !== 6}
                      className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl transition-all disabled:opacity-50"
                    >
                      {loading ? "Registering..." : "Verify & Register"}
                    </button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => handleResendOtp("phone")}
                        disabled={resendLoading || countdown > 0}
                        className="text-sm text-green-600 hover:text-green-700 disabled:opacity-50 font-medium"
                      >
                        {countdown > 0 ? `Resend OTP in ${countdown}s` : "Resend OTP"}
                      </button>
                    </div>
                  </form>
                )}

                {/* SUCCESS STEP */}
                {step === "success" && (
                  <div className="text-center py-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCheck className="w-12 h-12 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">Registration Complete!</h3>
                    <p className="text-gray-500 text-sm mt-2 mb-6">Your email and phone have been verified successfully.</p>

                    <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-5 mb-6">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Application ID</p>
                      <p className="text-2xl font-mono font-bold text-primary-700 mt-1">{sessionStorage.getItem("registeredApplicantId")}</p>
                      <p className="text-xs text-gray-500 mt-2">⚠️ Please save this ID for future reference</p>
                    </div>

                    <button
                      onClick={() => navigate("/apply")}
                      className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                    >
                      Continue to Application <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                )}

                {/* RESUME APPLICATION STEP */}
                {step === "continue" && (
                  <form onSubmit={handleResumeApplication} className="space-y-5">
                    <div className="text-center mb-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-10 h-10 text-purple-600" />
                      </div>
                      <h3 className="text-2xl font-bold">Resume Application</h3>
                      <p className="text-gray-500 text-sm mt-1">Enter your Application ID and registered Email</p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Application ID</label>
                      <div className="relative">
                        <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          required
                          value={continueData.appId}
                          onChange={(e) => setContinueData({ ...continueData, appId: e.target.value.toUpperCase() })}
                          className="w-full pl-12 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all font-mono"
                          placeholder="APP-2026-XXXX"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          required
                          value={continueData.email}
                          onChange={(e) => setContinueData({ ...continueData, email: e.target.value })}
                          className="w-full pl-12 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
                    >
                      {loading ? <RefreshCw className="w-5 h-5 animate-spin mx-auto" /> : "Continue Application"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setStep("contact")}
                      className="w-full text-primary-600 font-medium py-2 hover:text-primary-700 transition-colors text-sm"
                    >
                      ← Start New Application
                    </button>
                  </form>
                )}

                {/* Status Link */}
                <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                  <button onClick={() => setStep("status")} className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
                    Track Application Status →
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center text-xs opacity-80">
              <p>ERP System • Powered by <span className="font-bold">SlashCurate Technologies Pvt Ltd</span></p>
              <p className="mt-1">© 2025 S University. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
