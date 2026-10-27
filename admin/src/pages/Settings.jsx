import { useState } from "react";
import { AdminPage } from "../components/ui.jsx";
import { api } from "../api.js";

export default function Settings() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) return setMsg({ kind: "error", text: "New passwords don't match." });
    setBusy(true);
    try {
      await api("/admin/password", { method: "PUT", body: form });
      setMsg({ kind: "ok", text: "Password changed." });
      setForm({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (err) {
      setMsg({ kind: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminPage title="Settings" subtitle="Manage your admin account.">
      <form className="admin-card narrow-card" onSubmit={submit}>
        <h2>Change password</h2>
        <label className="field"><span>Current password</span><input type="password" value={form.currentPassword} onChange={set("currentPassword")} required /></label>
        <label className="field"><span>New password (min 8 characters)</span><input type="password" value={form.newPassword} onChange={set("newPassword")} minLength={8} required /></label>
        <label className="field"><span>Confirm new password</span><input type="password" value={form.confirm} onChange={set("confirm")} required /></label>
        {msg && <p className={`alert alert-${msg.kind}`}>{msg.text}</p>}
        <button className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Update password"}</button>
      </form>
      <div className="admin-card narrow-card">
        <h2>Email, payments & club details</h2>
        <p className="muted">
          Ticket emails, Paynow (EcoCash / OneMoney) keys and the manual payment numbers are set in <code>backend/.env</code>. Club
          contact details shown on the website are in <code>frontend/src/site.js</code>.
        </p>
      </div>
    </AdminPage>
  );
}
