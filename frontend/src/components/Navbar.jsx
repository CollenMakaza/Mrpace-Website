import { useEffect, useState } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Logo from "./Logo.jsx";
import { useAuth } from "../AuthContext.jsx";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/races", label: "Races" },
  { to: "/register", label: "Register" },
  { to: "/gallery", label: "Gallery" },
  { to: "/about", label: "About" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const overHero = location.pathname === "/" && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const doLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className={`nav ${overHero ? "nav-hero" : "nav-solid"}`}>
      <div className="container nav-inner">
        <Logo />
        <nav className="nav-links" aria-label="Main">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className="nav-link">
              {({ isActive }) => (
                <>
                  {l.label}
                  {isActive && <motion.span layoutId="nav-underline" className="nav-underline" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="nav-actions">
          {user ? (
            <>
              <Link to="/my-races" className="btn btn-ghost btn-sm">My Races</Link>
              <button className="btn btn-outline btn-sm" onClick={doLogout}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Log in</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">Join Mr Pace</Link>
            </>
          )}
        </div>
        <button className={`burger ${open ? "is-open" : ""}`} aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}>
          <span /><span /><span />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            key="scrim"
            className="mobile-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setOpen(false)}
          />
        )}
        {open && (
          <motion.div
            key="menu"
            className="mobile-menu"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.ul initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } } }}>
              {links.map((l) => (
                <motion.li key={l.to} variants={{ hidden: { opacity: 0, x: 40 }, show: { opacity: 1, x: 0 } }}>
                  <NavLink to={l.to} end={l.end}>{l.label}</NavLink>
                </motion.li>
              ))}
              <motion.li variants={{ hidden: { opacity: 0, x: 40 }, show: { opacity: 1, x: 0 } }} className="mobile-actions">
                {user ? (
                  <>
                    <Link to="/my-races" className="btn btn-primary">My Races</Link>
                    <button className="btn btn-outline" onClick={doLogout}>Log out</button>
                  </>
                ) : (
                  <>
                    <Link to="/signup" className="btn btn-primary">Join Mr Pace</Link>
                    <Link to="/login" className="btn btn-outline">Log in</Link>
                  </>
                )}
              </motion.li>
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
