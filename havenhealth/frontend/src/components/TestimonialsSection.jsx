import { Quote } from "lucide-react";
import { Spinner, ErrorBanner } from "./ui";

function initials(name) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export default function TestimonialsSection({ testimonials, loading, error }) {
  if (loading || error || testimonials.length === 0) {
    return (
      <section className="px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-6xl">
          {loading && <div className="flex justify-center text-forest-700"><Spinner size={24} /></div>}
          {error && <ErrorBanner message={error} />}
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-6xl rounded-[2.5rem] bg-forest-50 p-8 sm:p-12">
        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure key={t.id} className="flex flex-col">
              <Quote size={28} className="text-amber-500" />
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-ink-700">
                "{t.quote}"
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-forest-900 text-xs font-semibold text-cream">
                  {initials(t.author_name)}
                </span>
                <div>
                  <p className="text-sm font-semibold text-forest-950">{t.author_name}</p>
                  <p className="text-xs text-ink-500">{t.author_role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
