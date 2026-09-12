import { Link } from "react-router-dom";
import { HeartPulse, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-24 rounded-t-[2.5rem] bg-forest-950 px-6 pb-10 pt-16 text-forest-100 sm:px-10">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2 font-display text-lg font-semibold text-cream">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-amber-500 text-forest-950">
              <HeartPulse size={18} strokeWidth={2.4} />
            </span>
            Haven Health
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-forest-200">
            Real doctors, real appointments, without the waiting room. Book a
            visit in minutes and keep every record in one place.
          </p>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold uppercase tracking-wide text-cream">
            Explore
          </h4>
          <ul className="mt-4 space-y-3 text-sm text-forest-200">
            <li><a href="/#services" className="hover:text-amber-400">Services</a></li>
            <li><a href="/#doctors" className="hover:text-amber-400">Doctors</a></li>
            <li><a href="/#pricing" className="hover:text-amber-400">Pricing</a></li>
            <li><a href="/#faq" className="hover:text-amber-400">FAQ</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold uppercase tracking-wide text-cream">
            Account
          </h4>
          <ul className="mt-4 space-y-3 text-sm text-forest-200">
            <li><Link to="/login" className="hover:text-amber-400">Log in</Link></li>
            <li><Link to="/register" className="hover:text-amber-400">Create account</Link></li>
            <li><Link to="/dashboard" className="hover:text-amber-400">Dashboard</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold uppercase tracking-wide text-cream">
            Contact
          </h4>
          <ul className="mt-4 space-y-3 text-sm text-forest-200">
            <li className="flex items-center gap-2"><Phone size={15} /> (800) 555-0119</li>
            <li className="flex items-center gap-2"><Mail size={15} /> hello@havenhealth.app</li>
            <li className="flex items-center gap-2"><MapPin size={15} /> Remote-first, USA</li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-14 flex max-w-6xl flex-col gap-2 border-t border-forest-800 pt-6 text-xs text-forest-300 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Haven Health. All rights reserved.</p>
        <p>Demo project — not a real medical provider.</p>
      </div>
    </footer>
  );
}
