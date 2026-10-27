import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AdminPage } from "../components/ui.jsx";
import { api } from "../api.js";

export default function CheckIn() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    try {
      const d = await api("/admin/checkin", { method: "POST", body: { ticketCode: code } });
      setResult({ ok: true, n: Date.now(), ...d });
    } catch (err) {
      setResult({ ok: false, n: Date.now(), message: err.message });
    } finally {
      setBusy(false);
      setCode("");
      inputRef.current?.focus();
    }
  };

  const r = result?.registration;

  return (
    <AdminPage title="Race-day check-in" subtitle="Type the ticket code from the runner's email (or scan the QR with a scanner that types into this box).">
      <form className="checkin-form" onSubmit={submit}>
        <input
          ref={inputRef}
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="MP-XXXX-XXXX"
          className="mono"
          aria-label="Ticket code"
        />
        <button className="btn btn-primary btn-lg" disabled={busy}>{busy ? "Checking…" : "Check in"}</button>
      </form>

      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key={result.n}
            className={`checkin-result ${result.ok ? "ok" : "bad"}`}
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="checkin-icon">{result.ok ? "✓" : "✕"}</div>
            <h2>{result.message}</h2>
            {r && (
              <div className="checkin-info">
                <p><b>{r.user?.name}</b> · {r.user?.phone}</p>
                <p>{r.race?.title} · <b>{r.distance}</b></p>
                <p className="bib">BIB {r.bibNumber}</p>
                <p className="small">T-shirt: {r.tshirtSize || "—"}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </AdminPage>
  );
}
