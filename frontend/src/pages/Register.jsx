import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Page, Reveal, stagger, fadeUp } from "../components/Motion.jsx";
import RunnerLoader from "../components/RunnerLoader.jsx";
import PaymentPanel from "../components/PaymentPanel.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import Img from "../components/Img.jsx";
import useFetch from "../useFetch.js";
import { formatDate, formatTime, mediaUrl, money } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import { IMAGES } from "../site.js";

const STEPS = [
  ["Choose a race", "Pick an open race and your distance."],
  ["Pay", "EcoCash, OneMoney, card, or enter your payment reference."],
  ["We verify", "The Mr Pace team checks your payment."],
  ["Get your ticket", "Your race ticket is emailed to you."],
];

// Payments the runner still owes, with the payment form right here.
function PaymentsDue({ registrations, onPaid }) {
  const [payingId, setPayingId] = useState(null);
  const due = registrations.filter((r) => ["awaiting_payment", "rejected"].includes(r.status) && r.race?.canRegister !== false);
  if (!due.length) return null;

  return (
    <Reveal className="card due-card">
      <div className="due-head">
        <h2>Payments due</h2>
        <span className="pill">{due.length}</span>
      </div>
      <ul className="due-list">
        {due.map((r) => (
          <li key={r.id}>
            <div className="due-row">
              <div>
                <b>{r.race?.title}</b>
                <div className="small muted">{r.distance} · {r.race && formatDate(r.race.date)} · {money(r.fee)}</div>
                {r.status === "rejected" && (
                  <div className="small red">Payment not verified{r.adminNote ? `: ${r.adminNote}` : ""} – please pay again.</div>
                )}
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setPayingId(payingId === r.id ? null : r.id)}>
                {payingId === r.id ? "Close" : `Pay ${money(r.fee)}`}
              </button>
            </div>
            <AnimatePresence>
              {payingId === r.id && (
                <motion.div className="due-pay" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                  <PaymentPanel
                    registration={r}
                    onDone={(updated, message) => {
                      setPayingId(null);
                      onPaid(updated, message);
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        ))}
      </ul>
    </Reveal>
  );
}

export default function Register() {
  const { user } = useAuth();
  const races = useFetch("/races?when=upcoming");
  const mine = useFetch(user ? "/registrations/mine" : null);
  const [flash, setFlash] = useState("");

  const myRegs = mine.data?.registrations || [];
  const entered = new Map(myRegs.filter((r) => r.status !== "rejected").map((r) => [r.raceId, r]));
  const open = (races.data?.races || []).filter((r) => r.canRegister || entered.has(r.id));

  const onPaid = (updated, message) => {
    mine.setData((d) => ({ registrations: d.registrations.map((r) => (r.id === updated.id ? updated : r)) }));
    setFlash(message);
  };

  return (
    <Page>
      <section className="page-hero">
        <Img src={IMAGES.hero[0]} alt="" className="page-hero-bg" />
        <div className="page-hero-overlay" />
        <div className="container">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>Register</motion.h1>
          <p>Enter a race, pay your entry fee and get your ticket – all in one place.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <motion.ol className="reg-steps" variants={stagger} initial="hidden" animate="show">
            {STEPS.map(([t, d], i) => (
              <motion.li key={t} variants={fadeUp}>
                <span>{i + 1}</span>
                <div><b>{t}</b><small className="muted">{d}</small></div>
              </motion.li>
            ))}
          </motion.ol>

          {!user && (
            <Reveal className="card login-prompt">
              <div>
                <h2>Sign in to register</h2>
                <p className="muted">You need a free Mr Pace account to enter races and pay. Your ticket is sent to your email.</p>
              </div>
              <div className="hero-cta">
                <Link to="/signup?next=/register" className="btn btn-primary">Create account</Link>
                <Link to="/login?next=/register" className="btn btn-outline">Log in</Link>
              </div>
            </Reveal>
          )}

          <AnimatePresence>
            {flash && (
              <motion.p className="alert alert-ok" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} onClick={() => setFlash("")}>
                {flash}
              </motion.p>
            )}
          </AnimatePresence>

          {user && !mine.loading && <PaymentsDue registrations={myRegs} onPaid={onPaid} />}

          <div className="section-head reg-open-head">
            <div>
              <span className="eyebrow">Open for entries</span>
              <h2>Choose your race</h2>
            </div>
            {user && <Link to="/my-races" className="arrow-link">My races & tickets →</Link>}
          </div>

          {races.loading || (user && mine.loading) ? (
            <RunnerLoader label="Finding open races" />
          ) : races.error ? (
            <p className="alert alert-error">{races.error}</p>
          ) : open.length === 0 ? (
            <div className="empty">
              <p>No races are open for registration right now. New races will be posted soon.</p>
              <Link to="/races?tab=recent" className="btn btn-outline">See recent races</Link>
            </div>
          ) : (
            <motion.div className="reg-race-list" variants={stagger} initial="hidden" animate="show">
              {open.map((race) => {
                const reg = entered.get(race.id);
                const registerPath = `/races/${race.id}/register`;
                return (
                  <motion.article key={race.id} variants={fadeUp} className="reg-race">
                    <Link to={`/races/${race.id}`} className="reg-race-img"><Img src={mediaUrl(race.coverImage) || IMAGES.hero[1]} alt={race.title} /></Link>
                    <div className="reg-race-body">
                      <h3><Link to={`/races/${race.id}`}>{race.title}</Link></h3>
                      <p className="small muted">📅 {formatDate(race.date, { weekday: "short" })} · {formatTime(race.date)} · 📍 {race.location}</p>
                      <div className="reg-fees">
                        {race.distances.map((d) => (
                          <span key={d.label} className="reg-fee"><b>{d.label}</b> {money(d.fee)}</span>
                        ))}
                      </div>
                      {race.capacity > 0 && <p className="small muted">{race.spotsLeft} of {race.capacity} spots left</p>}
                    </div>
                    <div className="reg-race-action">
                      {reg ? (
                        <>
                          <StatusBadge status={reg.status} />
                          <Link to="/my-races" className="btn btn-outline btn-sm">View entry</Link>
                        </>
                      ) : (
                        <Link to={user ? registerPath : `/login?next=${encodeURIComponent(registerPath)}`} className="btn btn-primary">
                          Register
                        </Link>
                      )}
                    </div>
                  </motion.article>
                );
              })}
            </motion.div>
          )}
        </div>
      </section>
    </Page>
  );
}
