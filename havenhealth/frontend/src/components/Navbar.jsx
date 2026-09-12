import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X, HeartPulse } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/#services", label: "Services" },
  { to: "/#doctors", label: "Doctors" },
  { to: "/#pricing", label: "Pricing" },
  { to: "/#faq", label: "FAQ" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="sticky top-4 z-50 px-4 sm:px-6">
      <nav className="mx-auto flex max-w-6xl items-center justify-between rounded-full bg-forest-900/95 px-5 py-3 text-cream shadow-lg shadow-forest-950/10 backdrop-blur">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-amber-500 text-forest-950">
            <HeartPulse size={18} strokeWidth={2.4} />
          </span>
          Haven Health
        </Link>

        <div className="hidden items-center gap-7 text-sm font-medium text-forest-100 md:flex">
          {links.map((l) => (
            <a key={l.to} href={l.to} className="transition hover:text-amber-400">
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="rounded-full px-4 py-2 text-sm font-medium text-forest-100 transition hover:text-amber-400"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-forest-950 transition hover:bg-amber-600"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full px-4 py-2 text-sm font-medium text-forest-100 transition hover:text-amber-400"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-forest-950 transition hover:bg-amber-600"
              >
                Get started
              </Link>
            </>
          )}
        </div>

        <button
          className="grid h-9 w-9 place-items-center rounded-full bg-forest-800 text-cream md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>

      {open && (
        <div className="mx-auto mt-2 flex max-w-6xl flex-col gap-1 rounded-3xl bg-forest-900 p-4 text-cream md:hidden">
          {links.map((l) => (
            <a
              key={l.to}
              href={l.to}
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-2 text-sm font-medium hover:bg-forest-800"
            >
              {l.label}
            </a>
          ))}
          <div className="mt-2 flex gap-2 border-t border-forest-800 pt-3">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-full bg-forest-800 px-4 py-2 text-center text-sm font-medium"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex-1 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-forest-950"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-full bg-forest-800 px-4 py-2 text-center text-sm font-medium"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-full bg-amber-500 px-4 py-2 text-center text-sm font-semibold text-forest-950"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
