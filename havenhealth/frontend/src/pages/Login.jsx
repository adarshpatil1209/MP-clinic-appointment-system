import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { HeartPulse, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { formatApiError } from "../api/client";
import { ErrorBanner, FieldLabel, PrimaryButton, Spinner, inputClass } from "../components/ui";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(form.username, form.password);
      navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
    } catch (err) {
      setError(formatApiError(err, "Invalid username or password."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-sage-50 px-4 py-16">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-xl shadow-forest-950/5 sm:p-10">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold text-forest-950">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-forest-900 text-amber-500">
            <HeartPulse size={18} strokeWidth={2.4} />
          </span>
          Haven Health
        </Link>

        <h1 className="mt-8 font-display text-3xl font-semibold text-forest-950">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-ink-700">
          Log in to manage your appointments and message your doctors.
        </p>

        <div className="mt-5 rounded-xl bg-forest-50 px-4 py-3 text-xs text-forest-800">
          Demo login — username <strong>demo</strong>, password <strong>demopass123</strong>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <FieldLabel>Username</FieldLabel>
            <input
              className={inputClass}
              value={form.username}
              onChange={update("username")}
              autoComplete="username"
              required
            />
          </div>
          <div>
            <FieldLabel>Password</FieldLabel>
            <input
              type="password"
              className={inputClass}
              value={form.password}
              onChange={update("password")}
              autoComplete="current-password"
              required
            />
          </div>

          <ErrorBanner message={error} />

          <PrimaryButton type="submit" className="w-full" disabled={submitting}>
            {submitting ? <Spinner size={16} /> : <>Log in <ArrowRight size={16} /></>}
          </PrimaryButton>
        </form>

        <p className="mt-6 text-center text-sm text-ink-700">
          New here?{" "}
          <Link to="/register" className="font-semibold text-forest-900 hover:text-amber-600">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
