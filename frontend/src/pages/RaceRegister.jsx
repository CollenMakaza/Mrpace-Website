import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Page } from "../components/Motion.jsx";
import RunnerLoader from "../components/RunnerLoader.jsx";
import PaymentPanel from "../components/PaymentPanel.jsx";
import useFetch from "../useFetch.js";
import { api, formatDate, money } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import NotFound from "./NotFound.jsx";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

export default function RaceRegister() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, loading, error } = useFetch(`/races/${id}`);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ distance: "", tshirtSize: "M", emergencyName: "", emergencyPhone: "" });
  const [registration, setRegistration] = useState(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [doneMessage, setDoneMessage] = useState("");

  if (loading) return <div className="page-loader"><RunnerLoader label="Getting registration ready" /></div>;
  if (error) return <NotFound message={error} />;
  const { race } = data;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.distance) return setFormError("Please choose your distance.");
    setBusy(true);
    try {
      const d = await api("/registrations", { method: "POST", body: { ...form, raceId: race.id } });
      setRegistration(d.registration);
      if (d.registration.fee > 0) setStep(2);
      else {
        setDoneMessage("You're registered for this free race! An admin will confirm and email your ticket.");
        setStep(3);
      }
    } catch (err) {
      if (err.status === 409 && err.data?.registration) {
        const existing = err.data.registration;
        if (existing.status === "awaiting_payment") {
          setRegistration(existing);
          setStep(2);
        } else {
          navigate("/my-races");
        }
      } else setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const onPaid = (reg, message) => {
    setRegistration(reg);
    setDoneMessage(message);
    setStep(3);
  };

  if (!race.canRegister && step === 1) {
    return <NotFound title="Registration closed" message="Registration for this race is closed." />;
  }

  return (
    <Page className="register-page">
      <div className="container narrow">
        <Link to={`/races/${race.id}`} className="back-link dark">← Back to race</Link>
        <div className="register-head">
          <span className="eyebrow">Race registration</span>
          <h1>{race.title}</h1>
          <p className="muted">{formatDate(race.date, { weekday: "long" })} · {race.location}</p>
        </div>

        <ol className="wizard">
          {["Your details", "Payment", "Done"].map((label, i) => (
            <li key={label} className={step > i + 1 ? "done" : step === i + 1 ? "current" : ""}>
              <span>{step > i + 1 ? "✓" : i + 1}</span>
              {label}
            </li>
          ))}
        </ol>

        <div className="card register-card">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form key="s1" onSubmit={submit} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
                <p className="muted">Registering as <b>{user.name}</b> ({user.email})</p>

                <fieldset className="field">
                  <legend>Choose your distance *</legend>
                  <div className="distance-choices">
                    {race.distances.map((d) => (
                      <label key={d.label} className={`distance-choice ${form.distance === d.label ? "is-active" : ""}`}>
                        <input type="radio" name="distance" value={d.label} checked={form.distance === d.label} onChange={set("distance")} />
                        <b>{d.label}</b>
                        <span>{money(d.fee)}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <label className="field">
                  <span>T-shirt size</span>
                  <select value={form.tshirtSize} onChange={set("tshirtSize")}>
                    {SIZES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </label>

                <div className="form-row">
                  <label className="field">
                    <span>Emergency contact name *</span>
                    <input value={form.emergencyName} onChange={set("emergencyName")} required />
                  </label>
                  <label className="field">
                    <span>Emergency contact phone *</span>
                    <input value={form.emergencyPhone} onChange={set("emergencyPhone")} inputMode="tel" required />
                  </label>
                </div>

                {formError && <p className="alert alert-error">{formError}</p>}
                <button className="btn btn-primary btn-block" disabled={busy}>{busy ? "Saving…" : "Continue to payment →"}</button>
              </motion.form>
            )}

            {step === 2 && registration && (
              <motion.div key="s2" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
                <p className="muted">Distance: <b>{registration.distance}</b></p>
                <PaymentPanel registration={registration} onDone={onPaid} />
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="s3" className="done-box" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <motion.div className="done-icon" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", delay: 0.15 }}>✓</motion.div>
                <h2>You're almost at the start line!</h2>
                <p>{doneMessage}</p>
                <p className="muted small">We'll email your ticket to <b>{user.email}</b> once the payment is verified.</p>
                <div className="hero-cta center">
                  <Link to="/my-races" className="btn btn-primary">View my races</Link>
                  <Link to="/races" className="btn btn-outline">More races</Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Page>
  );
}
