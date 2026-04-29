import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { College, Course } from "../../types";
import {
  GraduationCap, Send, CheckCircle,
  User, BookOpen, Layers, FileText,
} from "lucide-react";

interface ApplyForm {
  course_id:       number;
  college_id:      number;
  first_name:      string;
  last_name:       string;
  dob:             string;
  gender:          string;
  phone:           string;
  email:           string;
  address:         string;
  city:            string;
  state:           string;
  pin_code:        string;
  previous_school: string;
  previous_grade:  string;
  statement:       string;
}

const STEPS = [
  { label: "Personal Info", icon: User      },
  { label: "Academic Info", icon: BookOpen  },
  { label: "Course Select", icon: Layers    },
  { label: "Review",        icon: FileText  },
];

export default function Apply() {
  const [step,       setStep]       = useState(0);
  const [colleges,   setColleges]   = useState<College[]>([]);
  const [courses,    setCourses]    = useState<Course[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);

  const {
    register, handleSubmit, watch, trigger,
    formState: { errors },
  } = useForm<ApplyForm>();

  const selectedCollege  = watch("college_id");
  const selectedCourseId = watch("course_id");
  const formValues       = watch();

  const filteredCourses = courses.filter(
    (c) => c.college_id === Number(selectedCollege)
  );

  useEffect(() => {
    Promise.all([api.get("/colleges"), api.get("/courses")]).then(
      ([cl, co]) => {
        setColleges(cl.data.data || []);
        setCourses(co.data.data  || []);
        setLoading(false);
      }
    );
  }, []);

  const stepFields: (keyof ApplyForm)[][] = [
    ["first_name","last_name","dob","gender","phone","email","address"],
    ["previous_school","previous_grade","statement"],
    ["college_id","course_id"],
  ];

  const nextStep = async () => {
    const valid = await trigger(stepFields[step]);
    if (valid) setStep((s) => s + 1);
  };

  const onSubmit = async (data: ApplyForm) => {
    setSubmitting(true);
    try {
      await api.post("/student/applications", {
        ...data,
        course_id:  Number(data.course_id),
        college_id: Number(data.college_id),
        dob:        new Date(data.dob).toISOString(),
      });
      setSubmitted(true);
      toast.success("Application submitted successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Submission failed");
    } finally {
      setSubmitting(false);
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
            Application Submitted! 🎉
          </h2>
          <p className="text-gray-500 mb-2">
            Your application is now under review by the admissions team.
          </p>
          <p className="text-sm text-gray-400 mb-8">
            A confirmation will be sent to{" "}
            <span className="font-semibold text-primary-600">
              {formValues.email}
            </span>{" "}
            once your account is approved by the registrar.
          </p>

          {/* Steps */}
          <div className="bg-blue-50 rounded-xl p-4 text-left mb-6">
            <p className="text-blue-700 text-sm font-semibold mb-3">
              📋 What happens next?
            </p>
            <div className="space-y-2">
              {[
                "Registrar reviews your application",
                "You get shortlisted & notified via email",
                "Login credentials will be emailed to you",
                "Visit college with original documents",
              ].map((s, i) => (
                <div key={i}
                  className="flex items-start gap-2 text-sm text-blue-600">
                  <span className="font-bold text-blue-400 shrink-0">
                    {i + 1}.
                  </span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>

          <Link
            to="/login"
            className="btn-primary w-full flex items-center
                       justify-center gap-2"
          >
            ← Back to Login
          </Link>
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

        {/* Sign in link */}
        <Link
          to="/login"
          className="text-sm text-blue-200 hover:text-white
                     transition-colors"
        >
          Already have an account?{" "}
          <span className="text-white font-bold underline
                           underline-offset-2">
            Sign In
          </span>
        </Link>
      </nav>

      {/* ── Title ── */}
      <div className="text-center py-6 px-4">
        <h1 className="text-3xl font-bold text-white">
          Student Admission Application
        </h1>
        <p className="text-blue-200 mt-1 text-sm">
          Complete all steps carefully • Takes about 5 minutes
        </p>
      </div>

      {/* ── Step Indicator ── */}
      <div className="max-w-3xl mx-auto px-4 mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map(({ label, icon: Icon }, i) => {
            const isDone   = i < step;
            const isActive = i === step;
            return (
              <React.Fragment key={i}>
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
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ── Form Card ── */}
      <div className="max-w-3xl mx-auto px-4 pb-16">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white rounded-2xl shadow-2xl p-8">

            {/* ══ STEP 0 — Personal Info ══ */}
            {step === 0 && (
              <div className="space-y-5">
                <h2 className="text-xl font-bold text-gray-900 flex
                               items-center gap-2">
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

                  <div>
                    <label className="form-label">Phone *</label>
                    <input
                      {...register("phone", { required: "Required" })}
                      className="input-field" placeholder="9876543210"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Email *</label>
                    <input
                      {...register("email", { required: "Required" })}
                      type="email" className="input-field"
                      placeholder="john@example.com"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.email.message}
                      </p>
                    )}
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

            {/* ══ STEP 1 — Academic Info ══ */}
            {step === 1 && (
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

            {/* ══ STEP 2 — Course Selection ══ */}
            {step === 2 && (
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
                    {...register("college_id", { required: "Required" })}
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
                          const available = c.total_seats - c.filled_seats;
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
                                  { required: "Please select a course" })}
                                type="radio"
                                value={c.id}
                                className="mt-0.5 accent-primary-600"
                              />
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900
                                             text-sm">
                                  {c.name}
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

            {/* ══ STEP 3 — Review ══ */}
            {step === 3 && (
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
    </div>
  );
}