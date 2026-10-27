import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api, money } from "../api.js";
import RunnerLoader from "./RunnerLoader.jsx";

/**
 * Lets a runner pay for a registration.
 * - EcoCash / OneMoney: Paynow sends a PIN prompt to the phone, we poll for the result.
 * - Card / other: redirects to Paynow's checkout page.
 * - Manual: runner sends money themselves and types the transaction reference.
 * After paying, the admin still verifies the registration before the ticket is emailed.
 */
export default function PaymentPanel({ registration, onDone }) {
  const [config, setConfig] = useState(null);
  const [method, setMethod] = useState("");
  const [phone, setPhone] = useState("");
  const [reference, setReference] = useState("");
  const [channel, setChannel] = useState("EcoCash");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [waiting, setWaiting] = useState(null); // { instructions, startedAt }
  const pollRef = useRef(null);

  useEffect(() => {
    api("/payments/config")
      .then((c) => {
        setConfig(c);
        setMethod(c.paynowEnabled ? "ecocash" : "manual");
      })
      .catch((e) => setError(e.message));
    return () => clearInterval(pollRef.current);
  }, []);

  const startPolling = () => {
    clearInterval(pollRef.current);
    const started = Date.now();
    pollRef.current = setInterval(async () => {
      try {
        const d = await api(`/registrations/${registration.id}/payment-status`);
        if (d.registration.payment?.paid) {
          clearInterval(pollRef.current);
          setWaiting(null);
          onDone(d.registration, "Payment received! An admin will verify it and email your ticket.");
        } else if (Date.now() - started > 3 * 60 * 1000) {
          clearInterval(pollRef.current);
          setWaiting(null);
          setError("We didn't get a confirmation in time. If money left your account, check My Races in a few minutes.");
        }
      } catch {
        /* keep polling */
      }
    }, 5000);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const body = method === "manual" ? { method, reference, channel, phone } : { method, phone };
      const d = await api(`/registrations/${registration.id}/pay`, { method: "POST", body });
      if (method === "manual") {
        onDone(d.registration, d.message);
      } else if (method === "web" && d.redirectUrl) {
        window.location.href = d.redirectUrl;
      } else {
        setWaiting({ instructions: d.instructions });
        startPolling();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!config) return error ? <p className="alert alert-error">{error}</p> : <RunnerLoader label="Loading payment options" compact />;

  const methods = [
    ...(config.paynowEnabled
      ? [
          { id: "ecocash", label: "EcoCash", hint: "PIN prompt on your phone" },
          { id: "onemoney", label: "OneMoney", hint: "PIN prompt on your phone" },
          { id: "web", label: "Card / Other", hint: "Visa, ZimSwitch via Paynow" },
        ]
      : []),
    { id: "manual", label: "Paid already", hint: "Enter your transaction reference" },
  ];

  if (waiting) {
    return (
      <motion.div className="pay-waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="phone-pulse">📱</div>
        <h3>Check your phone</h3>
        <p>{waiting.instructions || `Enter your ${method === "onemoney" ? "OneMoney" : "EcoCash"} PIN to approve ${money(registration.fee)}.`}</p>
        <RunnerLoader label="Waiting for payment" />
        <button className="btn btn-ghost btn-sm" onClick={() => { clearInterval(pollRef.current); setWaiting(null); }}>
          Cancel and try another way
        </button>
      </motion.div>
    );
  }

  return (
    <form className="pay-panel" onSubmit={submit}>
      <div className="pay-total">
        <span>Amount to pay</span>
        <b>{money(registration.fee)}</b>
      </div>

      <div className="pay-methods" role="radiogroup" aria-label="Payment method">
        {methods.map((m) => (
          <button
            type="button"
            key={m.id}
            role="radio"
            aria-checked={method === m.id}
            className={`pay-method ${method === m.id ? "is-active" : ""}`}
            onClick={() => setMethod(m.id)}
          >
            <b>{m.label}</b>
            <small>{m.hint}</small>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={method} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
          {method === "manual" ? (
            <>
              <div className="manual-box">
                <p>Send <b>{money(registration.fee)}</b> to Mr Pace using one of these:</p>
                <ul>
                  {config.manual.ecocash && <li><b>EcoCash:</b> {config.manual.ecocash}</li>}
                  {config.manual.bank && <li><b>Bank:</b> {config.manual.bank}</li>}
                </ul>
                <p className="muted small">Then enter the reference from your confirmation SMS or receipt below.</p>
              </div>
              <div className="form-row">
                <label className="field">
                  <span>Paid with</span>
                  <select value={channel} onChange={(e) => setChannel(e.target.value)}>
                    <option>EcoCash</option>
                    <option>OneMoney</option>
                    <option>InnBucks</option>
                    <option>Bank transfer</option>
                    <option>Cash at club</option>
                  </select>
                </label>
                <label className="field">
                  <span>Phone you paid from</span>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0771234567" inputMode="tel" />
                </label>
              </div>
              <label className="field">
                <span>Transaction reference *</span>
                <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. MP230915.1234.A12345" required />
              </label>
            </>
          ) : method === "web" ? (
            <p className="muted">You'll be taken to Paynow's secure page to pay by card or another method, then brought back here.</p>
          ) : (
            <label className="field">
              <span>{method === "onemoney" ? "OneMoney" : "EcoCash"} number *</span>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0771234567" inputMode="tel" required />
            </label>
          )}
        </motion.div>
      </AnimatePresence>

      {error && <p className="alert alert-error">{error}</p>}

      <button className="btn btn-primary btn-block" disabled={busy}>
        {busy ? "Please wait…" : method === "manual" ? "Submit payment for verification" : `Pay ${money(registration.fee)}`}
      </button>
      <p className="muted small center">🔒 After payment, the Mr Pace team verifies it and emails your race ticket.</p>
    </form>
  );
}
