import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, LogIn } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

interface LoginForm {
  email: string;
  password: string;
}

// Map role_id to dashboard paths (matching database seed order)
// 1=university_admin, 2=finance_controller, 3=registrar, 4=college_admin, 5=hod, 6=faculty, 7=student, 8=staff
const roleIdPaths: Record<number, string> = {
  1: "/admin/dashboard",     // university_admin
  2: "/finance/dashboard",   // finance_controller
  3: "/registrar/dashboard", // registrar
  4: "/college/dashboard",   // college_admin
  5: "/college/dashboard",   // hod -> college
  6: "/faculty/dashboard",   // faculty
  7: "/student/dashboard",   // student
  8: "/faculty/dashboard",   // staff -> faculty
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<LoginForm>({
    email: "",
    password: "",
  });

  // Password Login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error("Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/login", {
        email: formData.email,
        password: formData.password,
      });
      const { token, user } = res.data.data;
      login(token, user);
      toast.success(`Welcome back, ${user.username || user.email}!`);
      navigate(roleIdPaths[user.role_id] || "/student/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const rightPanelGradient = {
    backgroundColor: "#650C08",
    backgroundImage: [
      "radial-gradient(circle at 95% 5%, rgba(255,220,210,0.28) 0%, rgba(255,220,210,0.12) 12%, rgba(255,220,210,0.03) 28%, transparent 45%)",
      "linear-gradient(135deg, #7a1d16 0%, #650C08 35%, #b77a6f 100%)",
      "repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1.5px, transparent 1.5px, transparent 18px)"
    ].join(", "),
    backgroundBlendMode: "overlay, normal, normal" as const,
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-6xl min-h-[620px] rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row">

        {/* LEFT PANEL - Logo & Welcome */}
        <div className="w-full lg:w-[35%] bg-gray-100 flex flex-col items-center justify-center p-10 text-center">
          <div className="w-36 h-36 rounded-full overflow-hidden shadow-2xl border-8 border-white">
            <img
              src="/Logo.png"
              alt="S University"
              className="w-full h-full object-contain"
            />
          </div>

          <h1 className="mt-8 text-4xl font-bold text-gray-800 tracking-wide">
            S University
          </h1>

          {/* <p className="mt-3 text-lg font-semibold text-gray-700">
            Diploma • Degree • PG • PhD
          </p>
          <p className="text-sm text-gray-600 font-medium">
            (Private University)
          </p> */}
          <p className="mt-4 text-sm text-gray-500">
           Pacheri Bari, Jhunjhunu - 333515
          </p>
          <p className="mt-4 text-sm text-gray-500">
           Rajasthan, India
          </p>

          <div className="mt-10 text-gray-600 font-medium">
            Welcome to the Portal
          </div>
        </div>

        {/* RIGHT PANEL - Login Form */}
        <div
          className="w-full lg:w-[65%] flex flex-col justify-center p-8 lg:p-12 text-white"
          style={rightPanelGradient}
        >
          <div className="max-w-md mx-auto w-full">
            <h2 className="text-4xl font-extrabold text-rose-100 text-center mb-10">
              ERP LOGIN
            </h2>

            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl text-gray-900">
              <h3 className="text-xl font-bold mb-6">Welcome Back</h3>

              {/* Password Login Form */}
              <form onSubmit={handlePasswordLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="you@university.edu"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      className="input-field pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Link to="/forgot-password" className="text-sm text-primary-600 hover:underline">
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <LogIn className="w-4 h-4" />
                  )}
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                New student?{" "}
                <Link to="/register" className="text-primary-600 font-medium hover:underline">
                  Apply for Admission
                </Link>
              </p>

              {/* Demo Credentials */}
              <div className="mt-6 p-4 bg-primary-50 rounded-xl border border-primary-100">
                <p className="text-xs font-semibold text-primary-700 mb-2">
                  🔑 Demo Credentials
                </p>
                <div className="space-y-1 text-xs text-primary-600">
                  <p>Admin: univadmin@ntu.edu.in / Admin@123</p>
                  <p>Finance: finance@ntu.edu.in / Admin@123</p>
                  <p>Registrar: registrar@ntu.edu.in / Admin@123</p>
                  <p>College: cetadmin@ntu.edu.in / Admin@123</p>
                  <p>Faculty: rajesh.kumar@ntu.edu.in / Faculty@123</p>
                  <p>Student: 24cse001@student.ntu.edu.in / Student@123</p>
                </div>
              </div>
            </div>

            {/* Footer */}
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