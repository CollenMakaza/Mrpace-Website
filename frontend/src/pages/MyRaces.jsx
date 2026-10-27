import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Page, stagger, fadeUp } from "../components/Motion.jsx";
import RunnerLoader from "../components/RunnerLoader.jsx";
import StatusBadge, { StatusSteps } from "../components/StatusBadge.jsx";
import PaymentPanel from "../components/PaymentPanel.jsx";
import Img from "../components/Img.jsx";
import useFetch from "../useFetch.js";
import { api, formatDate, mediaUrl, money } from "../api.js";
import { useAuth } from "../AuthContext.jsx";

export default function MyRaces() {
  const { user } = useAuth();
  const { data, loading, error, setData } = useFetch("/registrations/mine");
  const [payingId, setPayingId] = useState(null);
  const [flash, setFlash] = useState("");

  const replace = (reg) =>
    setData((d) => ({ registrations: d.registrations.map((r) => (r.id === reg.id ? reg : r)) }));

  const cancel = async (reg) => {
    if (!window.confirm(`Cancel your registration for ${reg.race?.title}?`)) return;
    try {
      await api(`/registrations/${reg.id}`, { method: "DELETE" });
      setData((d) => ({ registrations: d.registrations.filter((r) => r.id !== reg.id) }));
    } catch (e) {
      setFlash(e.message);
    }
  };

  return (
    <Page>
      <div className="container section">
        <div className="section-head">
          <div>
            <span className="eyebrow">Hi {user.name.split(" ")[0]} 👋</span>
            <h1>My races & tickets</h1>
          </div>
          <Link to="/races" className="btn btn-primary">Find a race</Link>
        </div>

        <AnimatePresence>
          {flash && (
            <motion.p className="alert alert-ok" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} onClick={() => setFlash("")}>
              {flash}
            </motion.p>
          )}
        </AnimatePresence>

        {loading ? (
          <RunnerLoader label="Loading your races" />
        ) : error ? (
          <p className="alert alert-error">{error}</p>
        ) : data.registrations.length === 0 ? (
          <div className="empty">
            <p>You haven't registered for any races yet.</p>
            <Link to="/races" className="btn btn-primary">Browse upcoming races</Link>
          </div>
        ) : (
          <motion.div className="my-list" variants={stagger} initial="hidden" animate="show">
            {data.registrations.map((reg) => (
              <motion.article key={reg.id} variants={fadeUp} layout className={`my-card ${reg.status === "approved" ? "is-ticket" : ""}`}>
                <div className="my-card-media">
                  <Img src={mediaUrl(reg.race?.coverImage)} alt={reg.race?.title} />
                </div>
                <div className="my-card-body">
                  <div className="my-card-top">
                    <div>
                      <h3><Link to={`/races/${reg.raceId}`}>{reg.race?.title || "Race removed"}</Link></h3>
                      <p className="muted small">
                        {reg.race && formatDate(reg.race.date, { weekday: "short" })} · {reg.distance} · {money(reg.fee)}
                      </p>
                    </div>
                    <StatusBadge status={reg.status} />
                  </div>

                  <StatusSteps status={reg.status} />

                  {reg.status === "approved" && (
                    <div className="ticket-strip">
                      <div><small>Ticket</small><b className="mono">{reg.ticketCode}</b></div>
                      <div><small>Bib</small><b>{reg.bibNumber}</b></div>
                      <p className="small muted">Your ticket was emailed to {user.email}. Show it at the desk on race day.</p>
                    </div>
                  )}
                  {reg.status === "pending_verification" && (
                    <p className="small muted">
                      {reg.payment?.paid ? "Payment received." : `Payment reference ${reg.payment?.reference || ""} submitted.`} The Mr Pace team is verifying it –
                      your ticket will be emailed once approved.
                    </p>
                  )}
                  {reg.status === "rejected" && (
                    <p className="alert alert-error small">
                      We couldn't verify your payment.{reg.adminNote ? ` Reason: ${reg.adminNote}` : ""} You can submit payment again below.
                    </p>
                  )}

                  {["awaiting_payment", "rejected"].includes(reg.status) && reg.race?.canRegister !== false && (
                    <div className="my-actions">
                      <button className="btn btn-primary btn-sm" onClick={() => setPayingId(payingId === reg.id ? null : reg.id)}>
                        {payingId === reg.id ? "Close" : `Pay ${money(reg.fee)}`}
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => cancel(reg)}>Cancel registration</button>
                    </div>
                  )}

                  <AnimatePresence>
                    {payingId === reg.id && (
                      <motion.div className="my-pay" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                        <PaymentPanel
                          registration={reg}
                          onDone={(updated, message) => {
                            replace(updated);
                            setPayingId(null);
                            setFlash(message);
                          }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.article>
            ))}
          </motion.div>
        )}
      </div>
    </Page>
  );
}
