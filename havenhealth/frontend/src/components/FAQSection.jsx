import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Eyebrow, Spinner, ErrorBanner } from "./ui";

function FAQItem({ faq, open, onToggle }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-sm font-semibold text-forest-950">{faq.question}</span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-forest-700 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-5 text-sm leading-relaxed text-ink-700">
          {faq.answer}
        </div>
      )}
    </div>
  );
}

export default function FAQSection({ faqs, loading, error }) {
  const [openId, setOpenId] = useState(null);

  return (
    <section id="faq" className="px-4 py-24 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="mt-4 balance font-display text-4xl font-semibold text-forest-950 sm:text-5xl">
            Frequently asked questions
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-700">
            Find answers to common questions about booking, pricing, and how
            visits work. Can't find what you need? Reach out any time.
          </p>
        </div>

        <div className="space-y-3">
          {loading && (
            <div className="flex justify-center text-forest-700">
              <Spinner size={24} />
            </div>
          )}
          {error && <ErrorBanner message={error} />}
          {!loading &&
            !error &&
            faqs.map((faq) => (
              <FAQItem
                key={faq.id}
                faq={faq}
                open={openId === faq.id}
                onToggle={() => setOpenId(openId === faq.id ? null : faq.id)}
              />
            ))}
        </div>
      </div>
    </section>
  );
}
