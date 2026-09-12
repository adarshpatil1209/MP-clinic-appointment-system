import { Star, Users, ArrowUpRight } from "lucide-react";
import { Eyebrow, Spinner, ErrorBanner } from "./ui";

const AVAILABILITY_LABEL = {
  available: "Available now",
  today: "Available today",
  booked: "Fully booked",
};

const AVAILABILITY_DOT = {
  available: "bg-forest-700",
  today: "bg-amber-500",
  booked: "bg-ink-500",
};

function initials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const AVATAR_BG = [
  "bg-forest-100 text-forest-800",
  "bg-amber-100 text-amber-600",
  "bg-coral-100 text-coral-500",
  "bg-sky-100 text-sky-500",
];

export default function DoctorsSection({ doctors, loading, error }) {
  return (
    <section id="doctors" className="px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Eyebrow>Doctors</Eyebrow>
            <h2 className="mt-4 max-w-xl balance font-display text-4xl font-semibold text-forest-950 sm:text-5xl">
              Meet the team behind your care
            </h2>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-ink-700">
            Every doctor on Haven Health is licensed, background-checked, and
            reviewed by the patients they've treated.
          </p>
        </div>

        {loading && (
          <div className="mt-14 flex justify-center text-forest-700">
            <Spinner size={26} />
          </div>
        )}
        {error && <div className="mt-8"><ErrorBanner message={error} /></div>}

        {!loading && !error && (
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.map((doctor, i) => (
              <div
                key={doctor.id}
                className="group flex flex-col rounded-[2rem] border border-forest-900/8 bg-white p-6 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-forest-950/5"
              >
                <div className="flex items-start justify-between">
                  <span
                    className={`grid h-14 w-14 place-items-center rounded-2xl font-display text-lg font-semibold ${AVATAR_BG[i % AVATAR_BG.length]}`}
                  >
                    {initials(doctor.full_name)}
                  </span>
                  <span className="flex items-center gap-1 rounded-full bg-forest-50 px-3 py-1 text-xs font-semibold text-forest-800">
                    <Star size={12} className="fill-amber-500 text-amber-500" />
                    {doctor.rating}
                  </span>
                </div>

                <h3 className="mt-5 font-display text-lg font-semibold text-forest-950">
                  Dr. {doctor.full_name}
                </h3>
                <p className="text-sm text-ink-700">{doctor.specialty}</p>
                <p className="mt-3 text-sm leading-relaxed text-ink-700">
                  {doctor.bio}
                </p>

                <div className="mt-5 flex items-center gap-4 text-xs text-ink-500">
                  <span className="flex items-center gap-1">
                    <Users size={13} /> {doctor.patients_helped.toLocaleString()} patients
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${AVAILABILITY_DOT[doctor.availability]}`} />
                    {AVAILABILITY_LABEL[doctor.availability]}
                  </span>
                </div>

                <a
                  href="/register"
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-forest-800 transition group-hover:text-amber-600"
                >
                  Book with Dr. {doctor.full_name.split(" ")[0]} <ArrowUpRight size={15} />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
