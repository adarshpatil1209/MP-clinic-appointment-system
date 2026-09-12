import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { Eyebrow, Spinner, ErrorBanner, PrimaryButton, SecondaryButton } from "./ui";

export default function PricingSection({ plans, loading, error }) {
  return (
    <section id="pricing" className="px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-xl text-center">
          <Eyebrow className="mx-auto">Pricing</Eyebrow>
          <h2 className="mt-4 balance font-display text-4xl font-semibold text-forest-950 sm:text-5xl">
            Simple plans, no surprise bills
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-ink-700">
            Pay per visit, or subscribe for priority scheduling and unlimited
            messaging with your care team.
          </p>
        </div>

        {loading && (
          <div className="mt-14 flex justify-center text-forest-700">
            <Spinner size={26} />
          </div>
        )}
        {error && <div className="mt-8"><ErrorBanner message={error} /></div>}

        {!loading && !error && (
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`flex flex-col rounded-[2rem] p-8 ${
                  plan.is_highlighted
                    ? "bg-forest-900 text-cream shadow-2xl shadow-forest-950/20 md:-translate-y-4"
                    : "border border-forest-900/10 bg-white text-forest-950"
                }`}
              >
                <h3 className="font-display text-xl font-semibold">{plan.name}</h3>
                <p className={`mt-2 text-sm ${plan.is_highlighted ? "text-forest-200" : "text-ink-700"}`}>
                  {plan.tagline}
                </p>

                <p className="mt-6 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-semibold">
                    ${Number(plan.price_per_month).toFixed(0)}
                  </span>
                  <span className={`text-sm ${plan.is_highlighted ? "text-forest-300" : "text-ink-500"}`}>
                    /month
                  </span>
                </p>

                <ul className="mt-6 flex-1 space-y-3 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check
                        size={16}
                        className={`mt-0.5 shrink-0 ${plan.is_highlighted ? "text-amber-400" : "text-forest-700"}`}
                      />
                      <span className={plan.is_highlighted ? "text-forest-100" : "text-ink-700"}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {plan.is_highlighted ? (
                  <PrimaryButton as={Link} to="/register" className="mt-8 w-full">
                    Get started
                  </PrimaryButton>
                ) : (
                  <SecondaryButton as={Link} to="/register" className="mt-8 w-full">
                    Get started
                  </SecondaryButton>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
