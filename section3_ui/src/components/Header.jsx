// src/components/Header.jsx
import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

function TopNavLink({ to, label, onClick }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      onClick={onClick}
      className={({ isActive }) =>
        ["app-navlink", isActive ? "app-navlink-active" : "app-navlink-inactive"].join(" ")
      }
    >
      {label}
    </NavLink>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <div className="relative">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-2xl bg-slate-900" />
          <div className="leading-tight">
            <div className="text-sm font-semibold text-slate-900">Powerball UI</div>
            <div className="text-xs text-slate-500">PHASE 2 — UI</div>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-2">
          <TopNavLink to="/" label="Dashboard" />
          <TopNavLink to="/history" label="History" />
          <TopNavLink to="/table1" label="Filters" />
          <TopNavLink to="/decompose" label="Decompose" />
          <TopNavLink to="/future-draws" label="Future Draws" />
          <TopNavLink to="/settings" label="Settings" />
        </nav>

        <div className="flex items-center gap-2">
          <button className="app-btn-ghost hidden sm:inline-flex">Help</button>
          <button className="app-btn-primary hidden sm:inline-flex">Action</button>

          <button
            className="app-btn-ghost md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden mt-3 app-card p-3">
          <div className="flex flex-col gap-2">
            <TopNavLink to="/" label="Dashboard" onClick={() => setOpen(false)} />
            <TopNavLink to="/history" label="History" onClick={() => setOpen(false)} />
            <TopNavLink to="/table1" label="Filters" onClick={() => setOpen(false)} />
            <TopNavLink to="/decompose" label="Decompose" onClick={() => setOpen(false)} />
            <TopNavLink to="/future-draws" label="Future Draws" onClick={() => setOpen(false)} />
            <TopNavLink to="/settings" label="Settings" onClick={() => setOpen(false)} />
          </div>

          <div className="mt-3 flex gap-2">
            <button className="app-btn-ghost flex-1">Help</button>
            <button className="app-btn-primary flex-1">Action</button>
          </div>
        </div>
      )}
    </div>
  );
}
