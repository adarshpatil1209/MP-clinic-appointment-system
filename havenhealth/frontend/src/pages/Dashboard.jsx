import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  Clock,
  Stethoscope,
  X,
  Plus,
  ArrowUpRight,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { api, formatApiError } from "../api/client";
import {
  Eyebrow,
  ErrorBanner,
  SuccessBanner,
  FieldLabel,
  PrimaryButton,
  SecondaryButton,
  Spinner,
  inputClass,
} from "../components/ui";

const STATUS_STYLE = {
  pending: "bg-amber-100 text-amber-600",
  confirmed: "bg-forest-100 text-forest-800",
  completed: "bg-sky-100 text-sky-500",
  cancelled: "bg-coral-100 text-coral-500",
};

const emptyForm = {
  doctor: "",
  service: "",
  consultation_type: "video",
  preferred_date: "",
  preferred_time: "",
  reason: "",
};

export default function Dashboard() {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [consultRes, doctorsRes, servicesRes] = await Promise.all([
        api.get("/consultations/"),
        api.get("/doctors/"),
        api.get("/services/"),
      ]);
      setConsultations(consultRes.results ?? consultRes);
      setDoctors(doctorsRes.results ?? doctorsRes);
      setServices(servicesRes.results ?? servicesRes);
    } catch (err) {
      setLoadError(formatApiError(err, "Couldn't load your dashboard."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const resetForm = () => {
    setForm(emptyForm);
    setFormError("");
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        doctor: Number(form.doctor),
        service: form.service ? Number(form.service) : null,
      };
      const created = await api.post("/consultations/", payload);
      setConsultations((prev) => [created, ...prev]);
      setSuccess("Your consultation request has been sent.");
      resetForm();
    } catch (err) {
      setFormError(formatApiError(err, "Couldn't book that slot. Please try different details."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    setCancellingId(id);
    try {
      await api.del(`/consultations/${id}/`);
      setConsultations((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setLoadError(formatApiError(err, "Couldn't cancel that request."));
    } finally {
      setCancellingId(null);
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Eyebrow>Dashboard</Eyebrow>
            <h1 className="mt-4 font-display text-4xl font-semibold text-forest-950">
              Welcome back{user?.first_name ? `, ${user.first_name}` : ""}
            </h1>
            <p className="mt-2 text-sm text-ink-700">
              Manage your upcoming visits and book new consultations.
            </p>
          </div>
          <PrimaryButton onClick={() => setShowForm((v) => !v)}>
            {showForm ? <>Close <X size={16} /></> : <>Book a consultation <Plus size={16} /></>}
          </PrimaryButton>
        </div>

        {success && <div className="mt-6"><SuccessBanner message={success} /></div>}
        {loadError && <div className="mt-6"><ErrorBanner message={loadError} /></div>}

        {showForm && (
          <div className="mt-8 rounded-[2rem] bg-white p-6 shadow-lg shadow-forest-950/5 sm:p-8">
            <h2 className="font-display text-xl font-semibold text-forest-950">
              New consultation request
            </h2>
            <form onSubmit={handleSubmit} className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>Doctor</FieldLabel>
                <select className={inputClass} value={form.doctor} onChange={update("doctor")} required>
                  <option value="" disabled>Choose a doctor</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id} disabled={d.availability === "booked"}>
                      Dr. {d.full_name} — {d.specialty}{d.availability === "booked" ? " (fully booked)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel>Service</FieldLabel>
                <select className={inputClass} value={form.service} onChange={update("service")}>
                  <option value="">General consultation</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel>Visit type</FieldLabel>
                <select className={inputClass} value={form.consultation_type} onChange={update("consultation_type")}>
                  <option value="video">Video consultation</option>
                  <option value="phone">Phone call</option>
                  <option value="in_person">In-person visit</option>
                </select>
              </div>

              <div>
                <FieldLabel>Preferred date</FieldLabel>
                <input type="date" min={today} className={inputClass} value={form.preferred_date} onChange={update("preferred_date")} required />
              </div>

              <div>
                <FieldLabel>Preferred time</FieldLabel>
                <input type="time" className={inputClass} value={form.preferred_time} onChange={update("preferred_time")} required />
              </div>

              <div className="sm:col-span-2">
                <FieldLabel>What's this about? (optional)</FieldLabel>
                <textarea
                  className={inputClass}
                  rows={3}
                  value={form.reason}
                  onChange={update("reason")}
                  placeholder="e.g. Follow-up on blood pressure medication"
                />
              </div>

              <div className="sm:col-span-2">
                <ErrorBanner message={formError} />
              </div>

              <div className="flex gap-3 sm:col-span-2">
                <PrimaryButton type="submit" disabled={submitting}>
                  {submitting ? <Spinner size={16} /> : "Send request"}
                </PrimaryButton>
                <SecondaryButton type="button" onClick={resetForm}>
                  Cancel
                </SecondaryButton>
              </div>
            </form>
          </div>
        )}

        <div className="mt-10">
          <h2 className="font-display text-xl font-semibold text-forest-950">
            Your consultations
          </h2>

          {loading ? (
            <div className="mt-8 flex justify-center text-forest-700">
              <Spinner size={26} />
            </div>
          ) : consultations.length === 0 ? (
            <div className="mt-6 rounded-[2rem] border border-dashed border-forest-900/15 bg-white p-10 text-center">
              <Stethoscope size={28} className="mx-auto text-forest-700" />
              <p className="mt-3 text-sm text-ink-700">
                You don't have any consultations yet. Book your first visit to
                get started.
              </p>
              <PrimaryButton className="mx-auto mt-5" onClick={() => setShowForm(true)}>
                Book a consultation <ArrowUpRight size={16} />
              </PrimaryButton>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {consultations.map((c) => (
                <div key={c.id} className="rounded-[1.75rem] border border-forest-900/8 bg-white p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-display text-lg font-semibold text-forest-950">
                        Dr. {c.doctor_name}
                      </p>
                      <p className="text-sm text-ink-700">{c.service_name || "General consultation"}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLE[c.status]}`}>
                      {c.status}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-ink-500">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays size={14} /> {c.preferred_date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} /> {c.preferred_time?.slice(0, 5)}
                    </span>
                    <span className="capitalize">{c.consultation_type.replace("_", " ")}</span>
                  </div>

                  {c.reason && <p className="mt-3 text-sm text-ink-700">{c.reason}</p>}

                  {c.status !== "cancelled" && c.status !== "completed" && (
                    <button
                      onClick={() => handleCancel(c.id)}
                      disabled={cancellingId === c.id}
                      className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-coral-500 hover:text-coral-500/80 disabled:opacity-50"
                    >
                      {cancellingId === c.id ? <Spinner size={14} /> : <X size={14} />}
                      Cancel request
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="mt-10 text-sm text-ink-500">
          Looking for a different service? <Link to="/#services" className="font-semibold text-forest-900 hover:text-amber-600">Browse all services</Link>.
        </p>
      </main>

      <Footer />
    </div>
  );
}
