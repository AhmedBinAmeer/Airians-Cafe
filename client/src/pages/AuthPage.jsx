import { KeyRound, Mail, ShieldCheck, Smartphone, UserRound } from "lucide-react";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { api, getErrorMessage } from "../api/client.js";
import { setCredentials } from "../features/auth/authSlice.js";

const emptyCustomer = {
  name: "",
  email: "",
  phone: "",
  campusId: "",
  role: "student"
};

export default function AuthPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); // login, signup, admin, forgot
  
  // Login state
  const [login, setLogin] = useState({ email: "", password: "" });
  
  // Sign up state
  const [signup, setSignup] = useState(emptyCustomer);
  const [signupPassword, setSignupPassword] = useState("");
  const [signupOtp, setSignupOtp] = useState("");
  const [signupOtpRequested, setSignupOtpRequested] = useState(false);
  
  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotOtpRequested, setForgotOtpRequested] = useState(false);
  
  // Admin state
  const [admin, setAdmin] = useState({ email: "admin@airianscafe.edu", password: "Admin@12345" });
  
  // UI state
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ============= SIGNUP FLOW =============
  async function requestSignupOtp(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const { data } = await api.post("/auth/request-otp", signup);
      setSignupOtpRequested(true);
      setMessage(data.message);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function verifySignupOtp(event) {
    event.preventDefault();
    if (!signupPassword) {
      setError("Password is required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/verify-otp", {
        email: signup.email,
        code: signupOtp,
        password: signupPassword
      });
      dispatch(setCredentials(data));
      navigate("/");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  // ============= LOGIN FLOW =============
  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/login", login);
      dispatch(setCredentials(data));
      navigate("/");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  // ============= FORGOT PASSWORD FLOW =============
  async function requestForgotOtp(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const { data } = await api.post("/auth/forgot-password", { email: forgotEmail });
      setForgotOtpRequested(true);
      setMessage(data.message);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(event) {
    event.preventDefault();
    if (!forgotNewPassword) {
      setError("New password is required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/reset-password", {
        email: forgotEmail,
        code: forgotOtp,
        newPassword: forgotNewPassword
      });
      setMessage(data.message);
      setForgotEmail("");
      setForgotOtp("");
      setForgotNewPassword("");
      setForgotOtpRequested(false);
      setTimeout(() => setMode("login"), 2000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  // ============= ADMIN LOGIN =============
  async function handleAdminLogin(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/admin/login", admin);
      dispatch(setCredentials(data));
      navigate("/admin");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-lg bg-white p-6 shadow-soft sm:p-8">
        <div className="mb-6 inline-flex items-center gap-2 rounded-md bg-navy-50 px-3 py-2 text-sm font-black text-navy-800">
          <ShieldCheck size={17} />
          Secure campus access
        </div>
        <h1 className="text-3xl font-black text-navy-950">Sign in to Airian&apos;s Cafe</h1>
        <p className="mt-3 leading-7 text-slate-600">
          Sign up once with OTP, then use your password for all future logins.
        </p>
        <div className="mt-8 overflow-hidden rounded-lg">
          <img
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80"
            alt="Cafe seating"
            className="h-80 w-full object-cover"
          />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft sm:p-6">
        <div className="mb-6 grid grid-cols-2 gap-2 rounded-md bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => { setMode("login"); setError(""); setMessage(""); }}
            className={`rounded-md px-4 py-2 text-sm font-black ${
              mode === "login" ? "bg-white text-navy-950 shadow" : "text-slate-600"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => { setMode("signup"); setError(""); setMessage(""); }}
            className={`rounded-md px-4 py-2 text-sm font-black ${
              mode === "signup" ? "bg-white text-navy-950 shadow" : "text-slate-600"
            }`}
          >
            Sign up
          </button>
        </div>

        {mode === "login" && (
          <div className="space-y-4">
            <form onSubmit={handleLogin} className="grid gap-4">
              <label className="block">
                <span className="mb-1 block text-sm font-black text-navy-950">Email</span>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    value={login.email}
                    onChange={(event) => setLogin({ ...login, email: event.target.value })}
                    className="h-11 w-full rounded-md border border-slate-200 pl-10 pr-3 outline-none focus:border-navy-500"
                    required
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-black text-navy-950">Password</span>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="password"
                    value={login.password}
                    onChange={(event) => setLogin({ ...login, password: event.target.value })}
                    className="h-11 w-full rounded-md border border-slate-200 pl-10 pr-3 outline-none focus:border-navy-500"
                    required
                  />
                </div>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="h-11 rounded-md bg-navy-900 px-4 text-sm font-black text-white transition hover:bg-navy-800 disabled:bg-slate-300"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            <button
              type="button"
              onClick={() => { setMode("forgot"); setError(""); setMessage(""); }}
              className="w-full text-sm font-black text-navy-900 hover:underline"
            >
              Forgot password?
            </button>
          </div>
        )}

        {mode === "signup" && (
          <div className="space-y-4">
            {!signupOtpRequested ? (
              <form onSubmit={requestSignupOtp} className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-sm font-black text-navy-950">Name</span>
                    <div className="relative">
                      <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        value={signup.name}
                        onChange={(event) => setSignup({ ...signup, name: event.target.value })}
                        className="h-11 w-full rounded-md border border-slate-200 pl-10 pr-3 outline-none focus:border-navy-500"
                        required
                      />
                    </div>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-black text-navy-950">Account type</span>
                    <select
                      value={signup.role}
                      onChange={(event) => setSignup({ ...signup, role: event.target.value })}
                      className="h-11 w-full rounded-md border border-slate-200 px-3 outline-none focus:border-navy-500"
                    >
                      <option value="student">Student</option>
                      <option value="faculty">Faculty</option>
                      <option value="staff">Staff</option>
                      <option value="guest">Guest</option>
                    </select>
                  </label>
                </div>

                <label className="block">
                  <span className="mb-1 block text-sm font-black text-navy-950">Email</span>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="email"
                      value={signup.email}
                      onChange={(event) => setSignup({ ...signup, email: event.target.value })}
                      className="h-11 w-full rounded-md border border-slate-200 pl-10 pr-3 outline-none focus:border-navy-500"
                      required
                    />
                  </div>
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-sm font-black text-navy-950">WhatsApp phone</span>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        value={signup.phone}
                        onChange={(event) => setSignup({ ...signup, phone: event.target.value })}
                        placeholder="03001234567"
                        className="h-11 w-full rounded-md border border-slate-200 pl-10 pr-3 outline-none focus:border-navy-500"
                        required
                      />
                    </div>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-black text-navy-950">Campus ID</span>
                    <input
                      value={signup.campusId}
                      onChange={(event) => setSignup({ ...signup, campusId: event.target.value })}
                      className="h-11 w-full rounded-md border border-slate-200 px-3 outline-none focus:border-navy-500"
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="h-11 rounded-md bg-navy-900 px-4 text-sm font-black text-white transition hover:bg-navy-800 disabled:bg-slate-300"
                >
                  {loading ? "Sending..." : "Send OTP"}
                </button>
              </form>
            ) : (
              <form onSubmit={verifySignupOtp} className="grid gap-4 rounded-lg border border-slate-200 p-4">
                <label className="block">
                  <span className="mb-1 block text-sm font-black text-navy-950">OTP from email</span>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      value={signupOtp}
                      onChange={(event) => setSignupOtp(event.target.value)}
                      inputMode="numeric"
                      maxLength="6"
                      className="h-12 w-full rounded-md border border-slate-200 pl-10 pr-3 text-lg font-black tracking-[0.3em] outline-none focus:border-navy-500"
                      required
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-black text-navy-950">Create password</span>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="password"
                      value={signupPassword}
                      onChange={(event) => setSignupPassword(event.target.value)}
                      placeholder="Min 6 characters"
                      className="h-11 w-full rounded-md border border-slate-200 pl-10 pr-3 outline-none focus:border-navy-500"
                      required
                    />
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="h-11 rounded-md bg-saffron px-4 text-sm font-black text-navy-950 transition hover:bg-amber-300 disabled:bg-slate-300"
                >
                  {loading ? "Creating account..." : "Verify and sign up"}
                </button>

                <button
                  type="button"
                  onClick={() => { setSignupOtpRequested(false); setSignupOtp(""); setSignupPassword(""); }}
                  className="text-sm font-black text-slate-600 hover:underline"
                >
                  Back
                </button>
              </form>
            )}
          </div>
        )}

        {mode === "forgot" && (
          <div className="space-y-4">
            {!forgotOtpRequested ? (
              <form onSubmit={requestForgotOtp} className="grid gap-4">
                <label className="block">
                  <span className="mb-1 block text-sm font-black text-navy-950">Email</span>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(event) => setForgotEmail(event.target.value)}
                      className="h-11 w-full rounded-md border border-slate-200 pl-10 pr-3 outline-none focus:border-navy-500"
                      required
                    />
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="h-11 rounded-md bg-navy-900 px-4 text-sm font-black text-white transition hover:bg-navy-800 disabled:bg-slate-300"
                >
                  {loading ? "Sending..." : "Send reset OTP"}
                </button>

                <button
                  type="button"
                  onClick={() => { setMode("login"); setError(""); setMessage(""); }}
                  className="text-sm font-black text-slate-600 hover:underline"
                >
                  Back to login
                </button>
              </form>
            ) : (
              <form onSubmit={resetPassword} className="grid gap-4 rounded-lg border border-slate-200 p-4">
                <label className="block">
                  <span className="mb-1 block text-sm font-black text-navy-950">OTP from email</span>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      value={forgotOtp}
                      onChange={(event) => setForgotOtp(event.target.value)}
                      inputMode="numeric"
                      maxLength="6"
                      className="h-12 w-full rounded-md border border-slate-200 pl-10 pr-3 text-lg font-black tracking-[0.3em] outline-none focus:border-navy-500"
                      required
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-black text-navy-950">New password</span>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="password"
                      value={forgotNewPassword}
                      onChange={(event) => setForgotNewPassword(event.target.value)}
                      placeholder="Min 6 characters"
                      className="h-11 w-full rounded-md border border-slate-200 pl-10 pr-3 outline-none focus:border-navy-500"
                      required
                    />
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="h-11 rounded-md bg-saffron px-4 text-sm font-black text-navy-950 transition hover:bg-amber-300 disabled:bg-slate-300"
                >
                  {loading ? "Resetting..." : "Reset password"}
                </button>

                <button
                  type="button"
                  onClick={() => { setForgotOtpRequested(false); setForgotOtp(""); setForgotNewPassword(""); }}
                  className="text-sm font-black text-slate-600 hover:underline"
                >
                  Back
                </button>
              </form>
            )}
          </div>
        )}

        {mode === "admin" && (
          <form onSubmit={handleAdminLogin} className="grid gap-4">
            <label className="block">
              <span className="mb-1 block text-sm font-black text-navy-950">Admin email</span>
              <input
                type="email"
                value={admin.email}
                onChange={(event) => setAdmin({ ...admin, email: event.target.value })}
                className="h-11 w-full rounded-md border border-slate-200 px-3 outline-none focus:border-navy-500"
                required
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-black text-navy-950">Password</span>
              <input
                type="password"
                value={admin.password}
                onChange={(event) => setAdmin({ ...admin, password: event.target.value })}
                className="h-11 w-full rounded-md border border-slate-200 px-3 outline-none focus:border-navy-500"
                required
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="h-11 rounded-md bg-navy-900 px-4 text-sm font-black text-white transition hover:bg-navy-800 disabled:bg-slate-300"
            >
              {loading ? "Signing in..." : "Open admin dashboard"}
            </button>
          </form>
        )}

        {/* Admin tab button */}
        {!["admin"].includes(mode) && (
          <div className="mt-6 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => { setMode("admin"); setError(""); setMessage(""); }}
              className="w-full text-sm font-black text-slate-600 hover:text-navy-900"
            >
              Admin login →
            </button>
          </div>
        )}

        {message && <div className="mt-4 rounded-md bg-emerald-50 p-3 text-sm font-bold text-emerald-800">{message}</div>}
        {error && <div className="mt-4 rounded-md bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div>}
      </section>
    </div>
  );
}
