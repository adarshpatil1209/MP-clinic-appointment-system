import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HeartPulse, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { formatApiError } from "../api/client";
import { ErrorBanner, FieldLabel, PrimaryButton, Spinner, inputClass } from "../components/ui";

const initialForm = {
  first_name: "",
  last_name: "",
  username: "",
  email: "",
  password: "",
  password_confirm: "",
};

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.password_confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);
    try {
      await register(form);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(formatApiError(err, "Couldn't create your account. Please check your details."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-sage-50 px-4 py-16">
      <div className="w-full max-w-lg rounded-[2rem] bg-white p-8 shadow-xl shadow-forest-950/5 sm:p-10">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold text-forest-950">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-forest-900 text-amber-500">
            <HeartPulse size={18} strokeWidth={2.4} />
          </span>
          Haven Health
        </Link>

        <h1 className="mt-8 font-display text-3xl font-semibold text-forest-950">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-ink-700">
          It takes less than a minute. No insurance card required.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>First name</FieldLabel>
              <input className={inputClass} value={form.first_name} onChange={update("first_name")} required />
            </div>
            <div>
              <FieldLabel>Last name</FieldLabel>
              <input className={inputClass} value={form.last_name} onChange={update("last_name")} required />
            </div>
          </div>

          <div>
            <FieldLabel>Username</FieldLabel>
            <input className={inputClass} value={form.username} onChange={update("username")} autoComplete="username" required />
          </div>

          <div>
            <FieldLabel>Email</FieldLabel>
            <input type="email" className={inputClass} value={form.email} onChange={update("email")} autoComplete="email" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>Password</FieldLabel>
              <input type="password" className={inputClass} value={form.password} onChange={update("password")} autoComplete="new-password" required />
            </div>
            <div>
              <FieldLabel>Confirm password</FieldLabel>
              <input type="password" className={inputClass} value={form.password_confirm} onChange={update("password_confirm")} autoComplete="new-password" required />
            </div>
          </div>

          <ErrorBanner message={error} />

          <PrimaryButton type="submit" className="w-full" disabled={submitting}>
            {submitting ? <Spinner size={16} /> : <>Create account <ArrowRight size={16} /></>}
          </PrimaryButton>
        </form>

        <p className="mt-6 text-center text-sm text-ink-700">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-forest-900 hover:text-amber-600">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
