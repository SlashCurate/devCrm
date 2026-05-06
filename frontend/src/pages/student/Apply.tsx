import { useEffect, useState, useCallback, useRef, Fragment } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import api from "../../api/axios";
import toast from "react-hot-toast";
import type { College, Course, AdmissionCycle } from "../../types";
import {
  GraduationCap, Send, CheckCircle,
  User, BookOpen, Layers, FileText, XCircle, Clock,
  Calendar
} from "lucide-react";

interface ApplyForm {
  cycle_id:        number;
  course_id:       number;
  college_id:      number;
  first_name:      string;
  last_name:       string;
  email:           string;
  phone:           string;
  dob:             string;
  gender:          string;
  address:         string;
  city:            string;
  state:           string;
  pin_code:        string;
  previous_school: string;
  previous_grade:  string;
  statement:       string;
}

// Applicant info from registration (stored in sessionStorage)
interface ApplicantInfo {
  application_id: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
}

const STEPS = [
  { label: "Select Admission", icon: Calendar },
  { label: "Personal Info", icon: User      },
  { label: "Academic Info", icon: BookOpen  },
  { label: "Course Select", icon: Layers    },
  { label: "Review",         icon: FileText  },
];

export default function Apply() {
  const navigate = useNavigate();
  
  // Get applicant info from sessionStorage (set during registration)
  const [applicantInfo] = useState<ApplicantInfo>({
    application_id: sessionStorage.getItem("registeredApplicantId") || "",
    email: sessionStorage.getItem("registeredEmail") || "",
    phone: sessionStorage.getItem("registeredPhone") || "",
    first_name: sessionStorage.getItem("registeredFirstName") || "",
    last_name: sessionStorage.getItem("registeredLastName") || "",
  });

  const [step,           setStep]           = useState(0);
  const [colleges,       setColleges]       = useState<College[]>([]);
  const [courses,        setCourses]        = useState<Course[]>([]);
  const [cycles,         setCycles]         = useState<AdmissionCycle[]>([]);
  const [selectedCycle,  setSelectedCycle]  = useState<AdmissionCycle | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [submitting,     setSubmitting]     = useState(false);
  const [submitted,      setSubmitted]      = useState(false);
  const [admissionsOpen, setAdmissionsOpen] = useState(false);
  
  const [draftLoaded,    setDraftLoaded]    = useState(false);
  const [appId,          setAppId]          = useState<string | null>(null);
  

  // Status Checker State
  const [viewMode, setViewMode] = useState<"apply" | "status">("apply");
  const [statusAppId, setStatusAppId] = useState(applicantInfo.application_id);
  const [statusEmail, setStatusEmail] = useState(applicantInfo.email);
  const [statusResult, setStatusResult] = useState<any>(null);
  const [statusError, setStatusError] = useState("");

  // Redirect to register if no applicant info (not registered yet)
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



  const selectedCollege  = watch("college_id");
  const selectedCourseId = watch("course_id");
  const selectedCycleId  = watch("cycle_id");

const formValues = getValues();



  const filteredCourses = courses.filter(
    (c) => c.college_id === Number(selectedCollege)
  );
  
  // Pre-fill applicant info on mount (from registration)
  useEffect(() => {
    if (applicantInfo.first_name) setValue("first_name", applicantInfo.first_name);
    if (applicantInfo.last_name) setValue("last_name", applicantInfo.last_name);
  }, []);

  // Load admission cycles with real-world status and check existing application status
  useEffect(() => {
    const loadData = async () => {
      try {
        // Check if application already submitted
        if (applicantInfo.application_id) {
          try {
            const statusRes = await api.get(`/auth/application-status?application_id=${applicantInfo.application_id}&email=${applicantInfo.email}`);
            const appStatus = statusRes.data.data?.status;
            
            if (appStatus && appStatus !== "draft") {
              setSubmitted(true);
              setAppId(applicantInfo.application_id);
              toast.success(`Your application is ${appStatus.replace("_", " ")}`);
            }
          } catch (err) {
            // Application not found, continue with new application
          }
        }
        
        const [cyclesRes, collegesRes, coursesRes] = await Promise.all([
          api.get("/admissions/active-cycle"), // Use new endpoint with status
          api.get("/colleges"),
          api.get("/courses"),
        ]);
        
        const cyclesData = cyclesRes.data.data?.cycles || [];
        const hasOpen = cyclesRes.data.data?.has_open || false;
        
        setCycles(cyclesData);
        setColleges(collegesRes.data.data || []);
        setCourses(coursesRes.data.data || []);
        
        // Check if any admissions are open
        setAdmissionsOpen(hasOpen);
      } catch (err) {
        console.error("Failed to load data:", err);
        // No active cycle - that's ok, we'll show the closed message
        setAdmissionsOpen(false);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [applicantInfo.application_id, applicantInfo.email]);

  // Load draft using application_id
  const loadDraft = useCallback(async (cycleId: number) => {
    if (!applicantInfo.application_id || !cycleId || draftLoaded) return;
    
    try {
      const res = await api.get(`/admissions/draft?application_id=${applicantInfo.application_id}&cycle_id=${cycleId}`);
      if (res.data.data?.has_draft) {
        const draftData = JSON.parse(res.data.data.draft_data);
        reset(draftData);
        setDraftLoaded(true);
        toast.success("Draft loaded");
      }
    } catch (err) {
      // No draft found, that's ok
    }
  }, [reset, draftLoaded, applicantInfo.application_id]);

  // Auto-save functionality (using application_id)

  const stepFields: (keyof ApplyForm)[][] = [
    ["cycle_id"],
    ["first_name","last_name","dob","gender","address"],
    ["previous_school","previous_grade","statement"],
    ["college_id","course_id"],
  ];


const saveDraftNow = async () => {

  if (!selectedCycleId) return true;

  try {

    const values = getValues();

    await api.post("/admissions/draft", {
      application_id: applicantInfo.application_id,
      cycle_id: Number(selectedCycleId),

      draft_data: JSON.stringify(values),

      program_id: Number(values.course_id || 0),
      college_id: Number(values.college_id || 0),
      email: applicantInfo.email,
      phone: applicantInfo.phone,
    });

    toast.success("Progress saved");

    return true;

  } catch (err) {

    console.error("SAVE ERROR:", err);

    toast.error("Failed to save progress");

    return false;
  }
};



const nextStep = async () => {
  const valid = await trigger(stepFields[step]);

  if (!valid) return;

  // save before moving
  const saved = await saveDraftNow();

  if (!saved) return;

  if (step === 0 && selectedCycleId) {
    const cycle = cycles.find(c => c.id === selectedCycleId);
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

      // IMPORTANT
      program_id: Number(data.course_id),

      college_id: Number(data.college_id),

      // Personal Info
      first_name: data.first_name,
      last_name: data.last_name,
      email: applicantInfo.email,
      phone: applicantInfo.phone,

      dob: data.dob,
      gender: data.gender,
      address: data.address,
      city: data.city,
      state: data.state,
      pin_code: data.pin_code,

      // Academic
      previous_school: data.previous_school,
      previous_grade: data.previous_grade,
      statement: data.statement,
    };

    console.log("SUBMIT PAYLOAD:", payload);

    const res = await api.post(
      "/applications/public/submit",
      payload
    );

    setSubmitted(true);
    setAppId(res.data.data.application_id);

    toast.success("Application submitted successfully!");

  } catch (err: any) {

    console.error("SUBMIT ERROR:", err?.response?.data);

    toast.error(
      err?.response?.data?.error ||
      err?.response?.data?.message ||
      "Submission failed"
    );

  } finally {
    setSubmitting(false);
  }
};

  const handleCheckStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusError("");
    setStatusResult(null);
    try {
      const res = await api.get(`/auth/application-status?application_id=${statusAppId}&email=${statusEmail}`);
      setStatusResult(res.data.data);
    } catch (err: any) {
      setStatusError(err.response?.data?.error || "Application not found");
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-900
                      via-primary-800 to-primary-600 flex items-center
                      justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white border-t-transparent
                          rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-sm">Loading application form...</p>
        </div>
      </div>
    );
  }

  // ── Admissions Closed / Not Open Yet ─────────────────────────────────────
  // Allow users with existing application to continue filling the form
  const hasExistingApplication = !!applicantInfo.application_id;
  
  if (!admissionsOpen && !loading && !hasExistingApplication) {
    const upcomingCycle = cycles.find(c => c.status === "upcoming");
    const isUpcoming = !!upcomingCycle;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-900
                      via-primary-800 to-primary-600 flex items-center
                      justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md
                        w-full text-center">
          <div className={`w-20 h-20 rounded-full flex items-center
                          justify-center mx-auto mb-6 ${isUpcoming ? 'bg-blue-100' : 'bg-amber-100'}`}>
            <Clock className={`w-10 h-10 ${isUpcoming ? 'text-blue-600' : 'text-amber-600'}`} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isUpcoming ? "Coming Soon" : "Admissions Closed"}
          </h2>
          <p className="text-gray-500 mb-4">
            {isUpcoming 
              ? `Admissions for ${upcomingCycle?.name} will open on ${new Date(upcomingCycle?.application_start_date).toLocaleDateString()}`
              : "Currently, no admissions are open. Please check back later or contact the admissions office."
            }
          </p>
          
          {isUpcoming && (
            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Next Session:</strong> {upcomingCycle?.name}<br/>
                <strong>Opens:</strong> {new Date(upcomingCycle?.application_start_date).toLocaleDateString()}<br/>
                <strong>Closes:</strong> {new Date(upcomingCycle?.application_end_date).toLocaleDateString()}
              </p>
            </div>
          )}
          
          <div className="flex gap-3">
            <Link
              to="/application-status"
              className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all text-center"
            >
              Track Application
            </Link>
            <Link
              to="/register"
              className={`flex-1 py-2.5 font-semibold rounded-xl transition-all text-center ${
                isUpcoming 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              {isUpcoming ? "Pre-Register" : "Check Updates"}
            </Link>
          </div>
          
          <p className="text-xs text-gray-400 mt-6">
            📞 Admissions Helpline: 1800-123-4567 | Mon-Sat 10AM-5PM
          </p>
        </div>
      </div>
    );
  }

  // ── Success Screen ─────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-900
                      via-primary-800 to-primary-600 flex items-center
                      justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md
                        w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center
                          justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Application Submitted!
          </h2>
          <p className="text-gray-500 mb-2">
            Your application has been submitted successfully.
          </p>
          <p className="text-sm text-gray-400 mb-4">
            Application ID: <span className="font-semibold text-primary-600">{appId}</span>
          </p>
          
          {(selectedCycle?.application_fee ?? 0) > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-amber-700 text-sm">
                <span className="font-semibold">Next Step:</span> Complete payment of ₹{selectedCycle?.application_fee ?? 0} to proceed with your application.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Link
              to="/applicant/dashboard"
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              View My Application →
            </Link>
            <Link
              to="/"
              className="text-primary-600 hover:text-primary-800 text-sm"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Main ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900
                    via-primary-800 to-primary-600">

      {/* ── Minimal Public Navbar ── */}
      <nav className="max-w-3xl mx-auto flex items-center justify-between
                      px-4 py-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center
                          justify-center shadow-md">
            <GraduationCap className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">
              University ERP
            </p>
            <p className="text-blue-300 text-xs">Admissions Portal</p>
          </div>
        </div>

        <div className="flex items-center">
          <Link
            to="/login"
            className="text-sm text-blue-200 hover:text-white
                       transition-colors mr-4"
          >
            Sign In
          </Link>
          <button
            onClick={() => setViewMode(viewMode === "apply" ? "status" : "apply")}
            className="text-sm font-semibold text-white bg-primary-700 px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
          >
            {viewMode === "apply" ? "Check Status" : "Apply Now"}
          </button>
        </div>
      </nav>

      {/* ── Title ── */}
      <div className="text-center py-6 px-4">
        <h1 className="text-3xl font-bold text-white">
          {viewMode === "apply" ? "Student Admission Application" : "Check Application Status"}
        </h1>
        <p className="text-blue-200 mt-1 text-sm">
          {viewMode === "apply" ? "Complete all steps carefully • Takes about 5 minutes" : "Track your application progress"}
        </p>
      </div>

      {viewMode === "status" && (
        <div className="max-w-md mx-auto px-4 pb-16">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-600" />
              Application Tracker
            </h2>
            <form onSubmit={handleCheckStatus} className="space-y-4">
              <div>
                <label className="form-label">Application ID *</label>
                <input
                  type="text"
                  required
                  value={statusAppId}
                  onChange={(e) => setStatusAppId(e.target.value)}
                  className="input-field"
                  placeholder="APP-2024-XXXX"
                />
              </div>
              <div>
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  required
                  value={statusEmail}
                  onChange={(e) => setStatusEmail(e.target.value)}
                  className="input-field"
                  placeholder="john@example.com"
                />
              </div>
              <button type="submit" className="btn-primary w-full">Track Status</button>
            </form>

            {statusError && (
              <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm text-center">
                {statusError}
              </div>
            )}

            {statusResult && (
              <div className="mt-8 pt-6 border-t">
                <div className="text-center mb-6">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 shadow-inner ${
                    statusResult.Status === "enrolled" ? "bg-green-100 text-green-600" :
                    statusResult.Status === "rejected" ? "bg-red-100 text-red-600" :
                    statusResult.Status === "shortlisted" ? "bg-blue-100 text-blue-600" :
                    "bg-yellow-100 text-yellow-600"
                  }`}>
                    {statusResult.Status === "enrolled" ? <CheckCircle className="w-8 h-8" /> :
                     statusResult.Status === "rejected" ? <XCircle className="w-8 h-8" /> :
                     <Clock className="w-8 h-8" />}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Status: <span className="capitalize">{statusResult.Status.replace("_", " ")}</span>
                  </h3>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between pb-2 border-b">
                    <span className="text-gray-500">Applicant</span>
                    <span className="font-semibold text-gray-900">{statusResult.FirstName} {statusResult.LastName}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b">
                    <span className="text-gray-500">Program</span>
                    <span className="font-semibold text-gray-900">{statusResult.Program?.name}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b">
                    <span className="text-gray-500">College</span>
                    <span className="font-semibold text-gray-900">{statusResult.College?.name}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b">
                    <span className="text-gray-500">Applied On</span>
                    <span className="font-semibold text-gray-900">
                      {statusResult.SubmittedAt ? new Date(statusResult.SubmittedAt).toLocaleDateString() : "N/A"}
                    </span>
                  </div>
                </div>

                {statusResult.Remarks && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                    <strong>Remarks:</strong> {statusResult.Remarks}
                  </div>
                )}
                {statusResult.RejectionReason && statusResult.Status === "rejected" && (
                  <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                    <strong>Reason:</strong> {statusResult.RejectionReason}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {viewMode === "apply" && (
        <>
          {/* ── Step Indicator ── */}
      <div className="max-w-3xl mx-auto px-4 mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map(({ label, icon: Icon }, i) => {
            const isDone   = i < step;
            const isActive = i === step;
            return (
              <Fragment key={i}>
                <div className="flex flex-col items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    border-2 font-bold text-sm transition-all duration-300
                    ${isDone
                      ? "bg-green-400 border-green-400 text-white"
                      : isActive
                      ? "bg-white border-white text-primary-700 scale-110 shadow-lg"
                      : "bg-transparent border-blue-500 text-blue-400"}
                  `}>
                    {isDone
                      ? <CheckCircle className="w-5 h-5" />
                      : <Icon className="w-4 h-4" />
                    }
                  </div>
                  <p className={`text-xs mt-1.5 font-medium hidden sm:block
                    ${isActive ? "text-white" : "text-blue-400"}`}>
                    {label}
                  </p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 mb-5 transition-all
                    ${i < step ? "bg-green-400" : "bg-blue-700"}`}
                  />
                )}
              </Fragment>
            );
          })}
        </div>
      </div>

      {/* ── Form Card ── */}
      <div className="max-w-3xl mx-auto px-4 pb-16">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white rounded-2xl shadow-2xl p-8">

            {/* ══ STEP 0 — Select Admission Cycle ══ */}
            {step === 0 && (
              <div className="space-y-5">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary-600" />
                  Select Admission
                </h2>
                <p className="text-gray-600 text-sm">
                  Choose an available admission cycle to begin your application.
                </p>

                {/* Logged in User Info */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-green-800 text-sm font-medium">Applicant</p>
                    <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded">Verified</span>
                  </div>
                  <p className="text-green-900 font-semibold">{applicantInfo.email}</p>
                  {applicantInfo.phone && (
                    <p className="text-green-700 text-sm">{applicantInfo.phone}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">Admission Cycle *</label>
                 <select
  {...register("cycle_id", { 
    required: "Please select an admission cycle",
    valueAsNumber: true   
  })}
                    className="input-field"
                    onChange={(e) => {
                      const cycleId = Number(e.target.value);
                      if (cycleId) {
                        const cycle = cycles.find(c => c.id === cycleId);
                        setSelectedCycle(cycle || null);
                        // Load draft using application_id
                        if (applicantInfo.application_id) {
                          loadDraft(cycleId);
                        }
                      }
                    }}
                  >
                    <option value="">— Select an open admission cycle —</option>
                    {cycles.filter(c => c.status === "open" || c.status === "upcoming").map((cycle) => (
                      <option 
                        key={cycle.id} 
                        value={cycle.id}
                        disabled={cycle.status !== "open"}
                      >
                        {cycle.name} 
                        {cycle.status === "open" 
                          ? `(Open - ${cycle.days_until_close ?? 0} days left)` 
                          : `(Opens ${new Date(cycle.application_start_date).toLocaleDateString()})`
                        }
                        {cycle.application_fee > 0 ? ` - Fee: ₹${cycle.application_fee}` : ''}
                      </option>
                    ))}
                  </select>
                  {errors.cycle_id && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.cycle_id.message}
                    </p>
                  )}
                  
                  {/* Status Legend */}
                  <div className="flex gap-3 mt-2 text-xs">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      Open
                    </span>
                    <span className="flex items-center gap-1 text-gray-400">
                      <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                      Upcoming
                    </span>
                  </div>
                </div>

                {selectedCycle && (
                  <div className={`rounded-xl p-4 ${selectedCycle.status === 'open' ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`font-semibold ${selectedCycle.status === 'open' ? 'text-green-900' : 'text-blue-900'}`}>
                        {selectedCycle.name}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        selectedCycle.status === 'open' 
                          ? 'bg-green-200 text-green-800' 
                          : 'bg-blue-200 text-blue-800'
                      }`}>
                        {selectedCycle.status === 'open' ? `Open - ${selectedCycle.days_until_close ?? 0} days left` : 'Upcoming'}
                      </span>
                    </div>
                    <p className={`text-sm mb-2 ${selectedCycle.status === 'open' ? 'text-green-700' : 'text-blue-700'}`}>
                      {selectedCycle.description}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className={selectedCycle.status === 'open' ? 'text-green-600' : 'text-blue-600'}>Application Fee:</span>
                        <span className="ml-1 font-semibold">₹{selectedCycle.application_fee}</span>
                      </div>
                      <div>
                        <span className={selectedCycle.status === 'open' ? 'text-green-600' : 'text-blue-600'}>Admission Fee:</span>
                        <span className="ml-1 font-semibold">₹{selectedCycle.admission_fee}</span>
                      </div>
                    </div>
                    
                    {selectedCycle.status === 'open' && (selectedCycle.days_until_close ?? 0) <= 7 && (
                      <div className="mt-3 bg-amber-100 text-amber-800 text-xs p-2 rounded">
                        Hurry! Only {selectedCycle.days_until_close ?? 0} days left to apply.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ══ STEP 1 — Personal Info ══ */}
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary-600" />
                  Personal Information
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">First Name *</label>
                    <input
                      {...register("first_name", { required: "Required" })}
                      className="input-field" placeholder="John"
                    />
                    {errors.first_name && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.first_name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Last Name *</label>
                    <input
                      {...register("last_name", { required: "Required" })}
                      className="input-field" placeholder="Doe"
                    />
                    {errors.last_name && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.last_name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Date of Birth *</label>
                    <input
                      {...register("dob", { required: "Required" })}
                      type="date" className="input-field"
                    />
                    {errors.dob && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.dob.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Gender *</label>
                    <select
                      {...register("gender", { required: "Required" })}
                      className="input-field"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.gender && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.gender.message}
                      </p>
                    )}
                  </div>

                  {/* Show email/phone from registration (read-only) */}
                  <div className="sm:col-span-2 bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Email:</span> {applicantInfo.email}
                    </p>
                    {applicantInfo.phone && (
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Phone:</span> {applicantInfo.phone}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      Contact info verified during registration. Cannot be changed.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="form-label">Address *</label>
                  <input
                    {...register("address", { required: "Required" })}
                    className="input-field"
                    placeholder="123 Main Street"
                  />
                  {errors.address && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.address.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="form-label">City</label>
                    <input
                      {...register("city")}
                      className="input-field" placeholder="Mumbai"
                    />
                  </div>
                  <div>
                    <label className="form-label">State</label>
                    <input
                      {...register("state")}
                      className="input-field" placeholder="Maharashtra"
                    />
                  </div>
                  <div>
                    <label className="form-label">Pin Code</label>
                    <input
                      {...register("pin_code")}
                      className="input-field" placeholder="400001"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ══ STEP 2 — Academic Info ══ */}
            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-xl font-bold text-gray-900 flex
                               items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary-600" />
                  Academic Information
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">
                      Previous School / College *
                    </label>
                    <input
                      {...register("previous_school",
                        { required: "Required" })}
                      className="input-field"
                      placeholder="City High School"
                    />
                    {errors.previous_school && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.previous_school.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">
                      Final Grade / Percentage *
                    </label>
                    <input
                      {...register("previous_grade",
                        { required: "Required" })}
                      className="input-field" placeholder="85% or A+"
                    />
                    {errors.previous_grade && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.previous_grade.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="form-label">Personal Statement *</label>
                  <textarea
                    {...register("statement", { required: "Required" })}
                    className="input-field resize-none"
                    rows={6}
                    placeholder="Tell us about yourself, your goals, and why you want to join this program..."
                  />
                  {errors.statement && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.statement.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ══ STEP 3 — Course Selection ══ */}
            {step === 3 && (
              <div className="space-y-5">
                <h2 className="text-xl font-bold text-gray-900 flex
                               items-center gap-2">
                  <Layers className="w-5 h-5 text-primary-600" />
                  Course Selection
                </h2>

                {/* College Dropdown */}
                <div>
                  <label className="form-label">Select College *</label>
                 <select
  {...register("college_id", { 
    required: "Required",
    valueAsNumber: true
  })}
                    className="input-field"
                  >
                    <option value="">— Choose a college —</option>
                    {colleges.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                  {errors.college_id && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.college_id.message}
                    </p>
                  )}
                </div>

                {/* Course Cards */}
                {selectedCollege && (
                  <div>
                    <label className="form-label">Select Course *</label>
                    {filteredCourses.length === 0 ? (
                      <div className="text-center py-8 text-gray-400
                                      border-2 border-dashed rounded-xl">
                        No courses available for this college
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {filteredCourses.map((c) => {
                          const available = c.total_seats;
                          const isSelected =
                            Number(selectedCourseId) === c.id;
                          return (
                            <label
                              key={c.id}
                              className={`flex items-start gap-3 p-4
                                border-2 rounded-xl cursor-pointer
                                transition-all duration-200
                                ${isSelected
                                  ? "border-primary-500 bg-primary-50 shadow-sm"
                                  : "border-gray-200 hover:border-primary-300 hover:bg-gray-50"
                                }`}
                            >
                              <input
  {...register("course_id",
    { required: "Please select a course", valueAsNumber: true })}
  type="radio"
  value={c.id}
  className="mt-0.5 accent-primary-600"
/>
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900
                                             text-sm">
                                  {(c as any).department?.name ? `${(c as any).department.name} - ${c.name}` : c.name}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {c.code} • {c.duration_years} Years
                                </p>
                                <span className={`text-xs font-medium mt-1
                                  inline-block
                                  ${available > 10
                                    ? "text-green-600"
                                    : available > 0
                                    ? "text-yellow-600"
                                    : "text-red-500"
                                  }`}>
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
                      <p className="text-red-500 text-xs mt-2">
                        Please select a course
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ══ STEP 4 — Review ══ */}
            {step === 4 && (
              <div className="space-y-5">
                <h2 className="text-xl font-bold text-gray-900 flex
                               items-center gap-2">
                  <FileText className="w-5 h-5 text-primary-600" />
                  Review Your Application
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3
                               text-sm">
                  {[
                    ["Full Name",
                      `${formValues.first_name} ${formValues.last_name}`],
                    ["Date of Birth", formValues.dob],
                    ["Gender",        formValues.gender],
                    ["Phone",         formValues.phone],
                    ["Email",         formValues.email],
                    ["Address",
                      `${formValues.address}${formValues.city
                        ? ", " + formValues.city : ""}`],
                    ["State",         formValues.state],
                    ["Pin Code",      formValues.pin_code],
                    ["Prev. School",  formValues.previous_school],
                    ["Prev. Grade",   formValues.previous_grade],
                  ].map(([label, value]) => (
                    <div key={label}
                      className="bg-gray-50 p-3 rounded-xl">
                      <p className="text-gray-400 text-xs">{label}</p>
                      <p className="font-semibold text-gray-900 mt-0.5">
                        {value || "—"}
                      </p>
                    </div>
                  ))}
                </div>

                {formValues.statement && (
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-gray-400 text-xs mb-1">
                      Personal Statement
                    </p>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {formValues.statement}
                    </p>
                  </div>
                )}

                <div className="bg-amber-50 border border-amber-200
                                rounded-xl p-4">
                  <p className="text-amber-700 text-sm font-medium">
                    ⚠️ Please review all details carefully before submitting.
                    Once submitted, changes cannot be made.
                  </p>
                </div>
              </div>
            )}

            {/* ══ Navigation Buttons ══ */}
            <div className="flex items-center justify-between mt-8 pt-6
                            border-t border-gray-100">
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                disabled={step === 0}
                className="btn-secondary disabled:opacity-40
                           disabled:cursor-not-allowed"
              >
                ← Previous
              </button>

              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="btn-primary"
                >
                  Next →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary flex items-center gap-2
                             disabled:opacity-70"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white
                                    border-t-transparent rounded-full
                                    animate-spin" />
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
  );
}