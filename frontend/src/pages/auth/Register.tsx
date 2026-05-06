import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Mail, Phone, Lock, ArrowRight, CheckCircle, 
  RefreshCw, ShieldCheck, GraduationCap, Smartphone, LogIn, FileText, ArrowLeft, Clock
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";

type Step = "contact" | "verify-email" | "verify-phone" | "success" | "continue";

interface RegistrationData {
  email: string;
  phone: string;
  emailOtp: string;
  phoneOtp: string;
  firstName: string;
  lastName: string;
}

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("contact");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  // Admissions open check
  const [admissionsOpen, setAdmissionsOpen] = useState<boolean | null>(null);
  const [upcomingCycles, setUpcomingCycles] = useState<any[]>([]);
  
  const [data, setData] = useState<RegistrationData>({
    email: "",
    phone: "",
    emailOtp: "",
    phoneOtp: "",
    firstName: "",
    lastName: "",
  });

  // Continue application state
  const [continueData, setContinueData] = useState({
    appId: "",
    email: "",
  });

  // Check admissions status on mount
  useEffect(() => {
    const checkAdmissions = async () => {
      try {
        const res = await api.get("/admissions/active-cycle");
        const hasOpen = res.data.data?.has_open || false;
        const cycles = res.data.data?.cycles || [];
        
        setAdmissionsOpen(hasOpen);
        setUpcomingCycles(cycles.filter((c: any) => c.status === "upcoming"));
      } catch (err) {
        // No active cycle found
        setAdmissionsOpen(false);
      }
    };
    
    checkAdmissions();
  }, []);

  // Check if already has application in session
  useEffect(() => {
    const existingAppId = sessionStorage.getItem("registeredApplicantId");
    if (existingAppId && step === "contact") {
      toast.success(`Welcome back! You have application ${existingAppId}`);
    }
  }, []);

  // Handle continue to application
  const handleContinueToApply = () => {
    const appId = sessionStorage.getItem("registeredApplicantId");
    if (appId) {
      navigate("/apply");
    } else {
      toast.error("No active application found");
    }
  };

  // Resume application with ID
  const handleResumeApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!continueData.appId || !continueData.email) {
      toast.error("Please enter Application ID and Email");
      return;
    }
    
    setLoading(true);
    try {
      // Verify application exists by checking status
      const res = await api.get(`/auth/application-status?application_id=${continueData.appId}&email=${continueData.email}`);
      
      // Store for application form
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

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Step 1: Send OTPs to both email and phone
  const handleSendOtps = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.email || !data.phone) {
      toast.error("Please enter both email and phone number");
      return;
    }

    setLoading(true);
    try {
      // Send Email OTP
      const emailRes = await api.post("/auth/send-otp", { email: data.email, type: "email" });
      
      // Send Phone OTP
      const phoneRes = await api.post("/auth/send-otp", { phone: data.phone, type: "phone" });
      
      // Show both OTPs in console
      console.log("========================================");
      console.log("EMAIL OTP CODE");
      console.log("Email:", data.email);
      console.log("OTP Code:", emailRes.data.data.otp);
      console.log("========================================");
      console.log("PHONE OTP CODE");
      console.log("Phone:", data.phone);
      console.log("OTP Code:", phoneRes.data.data.otp);
      console.log("========================================");
      
      toast.success("OTPs sent! Check browser console.");
      setStep("verify-email");
      setCountdown(60);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to send OTPs");
    } finally {
      setLoading(false);
    }
  };

  // Verify Email OTP
  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.emailOtp) {
      toast.error("Please enter email OTP");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/verify-otp", {
        email: data.email,
        otp: data.emailOtp,
        type: "email",
      });
      
      toast.success("Email verified!");
      setStep("verify-phone");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  // Verify Phone OTP and Register
  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.phoneOtp) {
      toast.error("Please enter phone OTP");
      return;
    }

    setLoading(true);
    try {
      // Verify phone OTP
      await api.post("/auth/verify-otp", {
        phone: data.phone,
        otp: data.phoneOtp,
        type: "phone",
      });
      
      // Register applicant (no password needed)
      const res = await api.post("/auth/register-applicant", {
        email: data.email,
        phone: data.phone,
        first_name: data.firstName,
        last_name: data.lastName,
      });
      
      toast.success("Registration successful!");
      
      // Store registration data for application form
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

  const steps = [
    { id: "contact", label: "Contact", icon: Mail },
    { id: "verify-email", label: "Email OTP", icon: ShieldCheck },
    { id: "verify-phone", label: "Phone OTP", icon: Smartphone },
  ];

  const getStepIndex = (s: Step) => steps.findIndex(st => st.id === s);
  const currentStepIndex = getStepIndex(step === "success" ? "verify-phone" : step);

  // Show loading while checking admissions status
  if (admissionsOpen === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70">Checking admission status...</p>
        </div>
      </div>
    );
  }

  // Show Admissions Closed view when no admissions are open
  if (!admissionsOpen && step !== "continue") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          {/* Top Navigation */}
          <div className="flex items-center justify-end mb-6">
            <Link 
              to="/login" 
              className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </Link>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-amber-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Admissions Currently Closed
            </h2>
            <p className="text-gray-500 mb-6">
              We are not accepting new applications at this time. 
              Please check back later or track an existing application.
            </p>

            {upcomingCycles.length > 0 && (
              <div className="bg-blue-50 rounded-xl p-4 mb-6 text-left">
                <h3 className="font-semibold text-blue-900 mb-3">Upcoming Admission Cycles</h3>
                <div className="space-y-2">
                  {upcomingCycles.map((cycle) => (
                    <div key={cycle.id} className="text-sm">
                      <p className="font-medium text-blue-800">{cycle.name}</p>
                      <p className="text-blue-600">
                        Opens: {new Date(cycle.application_start_date).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep("continue")}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
              >
                Resume Application
              </button>
              <Link
                to="/application-status"
                className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
              >
                Track Status
              </Link>
            </div>

            <p className="text-xs text-gray-400 mt-6">
              Admissions Helpline: 1800-XXX-XXXX | Mon-Sat 9AM-5PM
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Top Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => step === "continue" ? setStep("contact") : setStep("continue")}
            className="flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors"
          >
            {step === "continue" ? (
              <><ArrowLeft className="w-4 h-4" /> Back to Register</>
            ) : (
              <><FileText className="w-4 h-4" /> Already Applied? Resume</>
            )}
          </button>
          <div className="flex items-center gap-4">
            <Link 
              to="/application-status" 
              className="text-white/70 hover:text-white text-sm transition-colors"
            >
              Track Application
            </Link>
            <Link 
              to="/login" 
              className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </Link>
          </div>
        </div>

        {/* Logo Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-xl mb-4">
            <GraduationCap className="w-10 h-10 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-white">S University</h1>
          <p className="text-primary-200 mt-1">Admission Portal</p>
        </div>

        {/* Modern Stepper */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isDone = currentStepIndex > i;
              
              return (
                <div key={s.id} className="flex flex-col items-center flex-1">
                  <div className={`
                    w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300
                    ${isDone ? "bg-green-500 text-white shadow-lg shadow-green-500/30" :
                      isActive ? "bg-white text-primary-700 shadow-lg shadow-white/20 scale-110" :
                      "bg-white/10 text-white/50"}
                  `}>
                    {isDone ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`text-xs mt-2 font-medium ${isActive ? "text-white" : "text-white/50"}`}>
                    {s.label}
                  </span>
                  {i < steps.length - 1 && (
                    <div className={`
                      absolute h-0.5 w-12 mt-5 ml-16
                      ${isDone ? "bg-green-500" : "bg-white/20"}
                    `} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Progress Bar */}
          <div className="h-1 bg-gray-100">
            <div 
              className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500"
              style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
            />
          </div>

          <div className="p-8">
            {/* Step 1: Contact Info */}
            {step === "contact" && (
              <form onSubmit={handleSendOtps} className="space-y-6">
                {/* Continue Existing Application Banner */}
                {sessionStorage.getItem("registeredApplicantId") && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-800 font-medium">
                          You have an active application
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          ID: {sessionStorage.getItem("registeredApplicantId")}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleContinueToApply}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
                  <p className="text-gray-500 mt-2">
                    Enter your contact details to get started
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        required
                        value={data.firstName}
                        onChange={(e) => setData({ ...data, firstName: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        required
                        value={data.lastName}
                        onChange={(e) => setData({ ...data, lastName: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        placeholder="Doe"
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
                        value={data.email}
                        onChange={(e) => setData({ ...data, email: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        required
                        value={data.phone}
                        onChange={(e) => setData({ ...data, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        placeholder="9876543210"
                        maxLength={10}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1 ml-1">We'll send OTPs to verify</p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {loading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                <p className="text-center text-sm text-gray-500">
                  Already have an account?{" "}
                  <Link to="/login" className="text-primary-600 font-semibold hover:underline">
                    Sign in
                  </Link>
                </p>
              </form>
            )}

            {/* Step 2: Verify Email */}
            {step === "verify-email" && (
              <form onSubmit={handleVerifyEmailOtp} className="space-y-6">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Verify Email</h2>
                  <p className="text-gray-500 mt-2">
                    Enter the 6-digit code sent to
                  </p>
                  <p className="text-primary-600 font-semibold mt-1">{data.email}</p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                  <p className="text-amber-800 text-sm text-center">
                    <strong>Development Mode:</strong> Check browser console (F12) for OTP
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 text-center">
                    Email OTP Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={data.emailOtp}
                    onChange={(e) => setData({ ...data, emailOtp: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                    className="w-full text-center text-3xl font-bold tracking-[0.5em] py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="000000"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || data.emailOtp.length !== 6}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-70"
                >
                  {loading ? "Verifying..." : "Verify Email"}
                </button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => setStep("contact")}
                    className="text-gray-500 hover:text-gray-700 font-medium"
                  >
                    ← Change Email
                  </button>
                  <button
                    type="button"
                    onClick={handleSendOtps}
                    disabled={countdown > 0 || loading}
                    className="text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400"
                  >
                    Resend {countdown > 0 && `(${countdown}s)`}
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Verify Phone */}
            {step === "verify-phone" && (
              <form onSubmit={handleVerifyPhoneOtp} className="space-y-6">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Smartphone className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Verify Phone</h2>
                  <p className="text-gray-500 mt-2">
                    Enter the 6-digit code sent to
                  </p>
                  <p className="text-primary-600 font-semibold mt-1">+91 {data.phone}</p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                  <p className="text-amber-800 text-sm text-center">
                    <strong>Development Mode:</strong> Check browser console (F12) for OTP
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 text-center">
                    Phone OTP Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={data.phoneOtp}
                    onChange={(e) => setData({ ...data, phoneOtp: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                    className="w-full text-center text-3xl font-bold tracking-[0.5em] py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="000000"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || data.phoneOtp.length !== 6}
                  className="w-full py-3.5 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-green-500/25 transition-all disabled:opacity-70"
                >
                  {loading ? "Verifying..." : "Verify Phone"}
                </button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => setStep("verify-email")}
                    className="text-gray-500 hover:text-gray-700 font-medium"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={handleSendOtps}
                    disabled={countdown > 0 || loading}
                    className="text-green-600 hover:text-green-700 font-medium disabled:text-gray-400"
                  >
                    Resend {countdown > 0 && `(${countdown}s)`}
                  </button>
                </div>
              </form>
            )}

            {/* Step 4: Success */}
            {step === "success" && (
              <div className="text-center py-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Verification Complete!
                </h2>
                <p className="text-gray-500 mb-2">
                  Your email and phone are verified.
                </p>
                <div className="bg-primary-50 rounded-xl p-4 mb-6">
                  <p className="text-sm text-gray-600">Application ID</p>
                  <p className="text-xl font-bold text-primary-700">{sessionStorage.getItem("registeredApplicantId") || "PENDING"}</p>
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={() => navigate("/apply")}
                    className="w-full py-3.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowRight className="w-5 h-5" />
                    Continue to Application
                  </button>
                  <p className="text-xs text-gray-400">
                    Save your Application ID for tracking status
                  </p>
                </div>
              </div>
            )}

            {/* Continue Application Step */}
            {step === "continue" && (
              <form onSubmit={handleResumeApplication} className="space-y-6">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Resume Application</h2>
                  <p className="text-gray-500 mt-2">
                    Already have an Application ID? Continue where you left off.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Application ID *
                    </label>
                    <input
                      type="text"
                      required
                      value={continueData.appId}
                      onChange={(e) => setContinueData({ ...continueData, appId: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="APP-2025-XXXX"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={continueData.email}
                      onChange={(e) => setContinueData({ ...continueData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-70"
                >
                  {loading ? "Verifying..." : "Continue Application"}
                </button>

                <div className="text-center pt-4 border-t">
                  <p className="text-sm text-gray-500 mb-3">Don't have an Application ID?</p>
                  <button
                    type="button"
                    onClick={() => setStep("contact")}
                    className="text-primary-600 font-semibold hover:underline"
                  >
                    Start New Registration
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex items-center justify-center gap-6 mt-6 text-white/60 text-xs">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Secure</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4" />
            <span>Verified</span>
          </div>
          <div className="flex items-center gap-1">
            <Lock className="w-4 h-4" />
            <span>Encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
}
