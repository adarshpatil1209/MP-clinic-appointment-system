import { Loader2 } from "lucide-react";

export function Eyebrow({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full bg-forest-100 px-3 py-1 text-xs font-semibold text-forest-800 ${className}`}
    >
      {children}
    </span>
  );
}

export function PrimaryButton({ as: Comp = "button", className = "", children, ...props }) {
  return (
    <Comp
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-forest-950 transition hover:-translate-y-0.5 hover:bg-amber-600 hover:shadow-lg hover:shadow-amber-500/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 ${className}`}
      {...props}
    >
      {children}
    </Comp>
  );
}

export function SecondaryButton({ as: Comp = "button", className = "", children, ...props }) {
  return (
    <Comp
      className={`inline-flex items-center justify-center gap-2 rounded-full border border-forest-900/15 bg-white px-6 py-3 text-sm font-semibold text-forest-900 transition hover:-translate-y-0.5 hover:border-forest-900/30 ${className}`}
      {...props}
    >
      {children}
    </Comp>
  );
}

export function Spinner({ size = 18, className = "" }) {
  return <Loader2 size={size} className={`animate-spin ${className}`} />;
}

export function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="rounded-2xl border border-coral-500/30 bg-coral-100 px-4 py-3 text-sm text-coral-500">
      {message}
    </div>
  );
}

export function SuccessBanner({ message }) {
  if (!message) return null;
  return (
    <div className="rounded-2xl border border-forest-700/20 bg-forest-100 px-4 py-3 text-sm text-forest-800">
      {message}
    </div>
  );
}

export function FieldLabel({ children }) {
  return <label className="mb-1.5 block text-sm font-medium text-ink-700">{children}</label>;
}

export const inputClass =
  "w-full rounded-xl border border-ink-900/10 bg-white px-4 py-2.5 text-sm text-ink-900 placeholder:text-ink-500 focus:border-forest-700 focus:outline-none focus:ring-2 focus:ring-forest-700/20";
