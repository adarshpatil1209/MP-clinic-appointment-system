import { Link } from "react-router-dom";
import { ArrowUpRight, Activity, ShieldCheck } from "lucide-react";
import { PrimaryButton, SecondaryButton } from "./ui";

export default function Hero() {
  return (
    <section className="px-4 pt-10 sm:px-6 sm:pt-14">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="mb-5 text-sm font-medium uppercase tracking-[0.14em] text-forest-700">
            Haven Health · Care on your terms
          </p>
          <h1 className="balance font-display text-[2.75rem] font-semibold leading-[1.02] text-forest-950 sm:text-6xl lg:text-[4.2rem]">
            Feel better,
            <br />
            faster than a
            <br />
            waiting room.
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-700">
            Book a real doctor for a video, phone, or in-person visit in
            minutes. Cardiology, mental wellness, dental care, and more, all
            tracked in one place.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <PrimaryButton as={Link} to="/register">
              Book a consultation <ArrowUpRight size={16} />
            </PrimaryButton>
            <SecondaryButton as="a" href="#services">
              See our services
            </SecondaryButton>
          </div>

          <div className="mt-10 flex items-center gap-5 text-sm text-ink-700">
            <div className="flex -space-x-3">
              {["SR", "MJ", "AR", "+2k"].map((initials) => (
                <span
                  key={initials}
                  className="grid h-10 w-10 place-items-center rounded-full border-2 border-sage-50 bg-forest-100 text-xs font-semibold text-forest-800"
                >
                  {initials}
                </span>
              ))}
            </div>
            <p>
              <span className="font-semibold text-forest-950">2,000+</span> patients
              booked a visit this month
            </p>
          </div>
        </div>

        <div className="relative">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-forest-900 p-8 sm:p-10">
            <div
              className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-forest-700/40 blur-2xl"
              aria-hidden
            />
            <div
              className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-amber-500/20 blur-2xl"
              aria-hidden
            />

            <div className="relative flex items-center justify-between text-cream">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-forest-200">
                  This week
                </p>
                <p className="mt-1 font-display text-2xl font-semibold">
                  Your health, mapped
                </p>
              </div>
              <span className="grid h-11 w-11 place-items-center rounded-full bg-amber-500 text-forest-950">
                <Activity size={20} />
              </span>
            </div>

            <div className="relative mt-8 grid grid-cols-2 gap-3">
              <div className="col-span-2 rounded-2xl bg-forest-800/70 p-5">
                <p className="text-xs uppercase tracking-wide text-forest-200">Heart rate</p>
                <div className="mt-3 flex items-end gap-1">
                  {[40, 65, 30, 80, 55, 95, 60, 70, 45].map((h, i) => (
                    <span
                      key={i}
                      className="w-2.5 rounded-full bg-amber-500/90"
                      style={{ height: `${h * 0.5}px` }}
                    />
                  ))}
                </div>
                <p className="mt-3 text-2xl font-semibold text-cream">72 bpm</p>
              </div>

              <div className="rounded-2xl bg-cream p-5 text-forest-950">
                <p className="text-xs uppercase tracking-wide text-forest-700">Wellness</p>
                <p className="mt-2 font-display text-3xl font-semibold">86%</p>
                <p className="mt-1 text-xs text-ink-500">On track this month</p>
              </div>

              <div className="rounded-2xl bg-amber-500 p-5 text-forest-950">
                <ShieldCheck size={20} />
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide">
                  Verified doctors
                </p>
                <p className="mt-1 text-xs text-forest-900/80">Licensed &amp; background-checked</p>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-6 left-6 flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-xl shadow-forest-950/10 sm:left-10">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-coral-100 text-coral-500 font-display font-semibold">
              9m
            </span>
            <div>
              <p className="text-sm font-semibold text-forest-950">Next available slot</p>
              <p className="text-xs text-ink-500">Dr. Amara Okafor · Cardiology</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
