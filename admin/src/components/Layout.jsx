import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import Logo from "./Logo.jsx";
import { useAdmin } from "../AdminAuth.jsx";
import { PUBLIC_SITE } from "../site.js";

const links = [
  { to: "/", label: "Dashboard", icon: "📊", end: true },
  { to: "/races", label: "Races", icon: "🏁" },
  { to: "/registrations", label: "Registrations", icon: "🧾" },
  { to: "/check-in", label: "Race-day check-in", icon: "✅" },
  { to: "/gallery", label: "Gallery", icon: "📷" },
  { to: "/runners", label: "Runners", icon: "🏃🏾" },
  { to: "/settings", label: "Settings", icon: "⚙️" },
];

export default function Layout({ children }) {
  const { admin, logout } = useAdmin();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <div className={`admin-shell ${open ? "side-open" : ""}`}>
      <aside className="side">
        <div className="side-head">
          <Logo />
          <span className="side-badge">ADMIN</span>
        </div>
        <nav>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className="side-link">
              {({ isActive }) => (
                <>
                  {isActive && <motion.span layoutId="side-active" className="side-active" />}
                  <span className="side-icon">{l.icon}</span>
                  <span>{l.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="side-foot">
          <a href={PUBLIC_SITE} target="_blank" rel="noreferrer" className="side-link"><span className="side-icon">🌍</span>View website</a>
          <div className="side-user">
            <small>Signed in as</small>
            <b>{admin.email}</b>
          </div>
          <button className="btn btn-outline btn-sm btn-block" onClick={logout}>Log out</button>
        </div>
      </aside>
      <div className="side-scrim" onClick={() => setOpen(false)} />
      <div className="admin-main">
        <header className="topbar">
          <button className="burger-admin" aria-label="Menu" onClick={() => setOpen(!open)}>☰</button>
          <Logo />
        </header>
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}
