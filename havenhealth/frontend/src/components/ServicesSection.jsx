import {
  HeartPulse,
  Brain,
  Smile,
  ClipboardCheck,
  Sparkles,
  Apple,
  ArrowUpRight,
} from "lucide-react";
import { Eyebrow, Spinner, ErrorBanner } from "./ui";

const ICONS = {
  "heart-pulse": HeartPulse,
  brain: Brain,
  tooth: Smile,
  "clipboard-check": ClipboardCheck,
  sparkles: Sparkles,
  apple: Apple,
};

const ACCENTS = {
  teal: "bg-forest-900 text-cream",
  amber: "bg-amber-500 text-forest-950",
  sky: "bg-sky-100 text-forest-950",
};

export default function ServicesSection({ services, loading, error }) {
  const featured = services.find((s) => s.is_featured) || services[0];
  const rest = services.filter((s) => s.id !== featured?.id).slice(0, 5);

  return (
    <section id="services" className="px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Eyebrow>Services</Eyebrow>
            <h2 className="mt-4 max-w-xl balance font-display text-4xl font-semibold text-forest-950 sm:text-5xl">
              Every kind of care, one appointment away
            </h2>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-ink-700">
            From a routine cleaning to an ongoing condition, choose a service
            and we'll match you with a doctor who takes it seriously.
          </p>
        </div>

        {loading && (
          <div className="mt-14 flex justify-center text-forest-700">
            <Spinner size={26} />
          </div>
        )}
        {error && <div className="mt-8"><ErrorBanner message={error} /></div>}

        {!loading && !error && (
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {featured && (
              <a
                href="/register"
                className="group relative flex flex-col justify-between overflow-hidden rounded-[2rem] bg-forest-900 p-8 text-cream transition hover:-translate-y-1 lg:col-span-2 lg:row-span-2"
              >
                <div
                  className="absolute -right-10 -top-10 h-52 w-52 rounded-full bg-forest-700/50 blur-2xl transition group-hover:bg-amber-500/20"
                  aria-hidden
                />
                <div className="relative">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-500 text-forest-950">
                    {ICONS[featured.icon] ? (
                      (() => {
                        const Icon = ICONS[featured.icon];
                        return <Icon size={22} />;
                      })()
                    ) : (
                      <HeartPulse size={22} />
                    )}
                  </span>
                  <h3 className="mt-6 font-display text-3xl font-semibold">
                    {featured.name}
                  </h3>
                  <p className="mt-3 max-w-sm text-sm leading-relaxed text-forest-100">
                    {featured.description || featured.short_description}
                  </p>
                </div>
                <span className="relative mt-10 inline-flex items-center gap-2 text-sm font-semibold text-amber-400">
                  Explore now <ArrowUpRight size={16} />
                </span>
              </a>
            )}

            {rest.map((service) => {
              const Icon = ICONS[service.icon] || HeartPulse;
              return (
                <a
                  key={service.id}
                  href="/register"
                  className={`group flex flex-col justify-between rounded-[2rem] p-7 transition hover:-translate-y-1 ${
                    ACCENTS[service.accent] || "bg-white text-forest-950"
                  }`}
                >
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/25">
                    <Icon size={20} />
                  </span>
                  <div className="mt-8">
                    <h3 className="font-display text-xl font-semibold">
                      {service.name}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed opacity-85">
                      {service.short_description}
                    </p>
                  </div>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold opacity-90">
                    Explore now <ArrowUpRight size={15} />
                  </span>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
