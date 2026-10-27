import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "./AuthLayout.jsx";
import { useAuth } from "../AuthContext.jsx";

export default function Signup() {
  const { user, signup } = useAuth();
  const [params] = useSearchParams();
  const next = params.get("next") || "/races";
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", gender: "", dateOfBirth: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={next} replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) return setError("Passwords don't match.");
    setBusy(true);
    try {
      const { confirm, ...body } = form;
      await signup(body);
      navigate(next, { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Join Mr Pace" subtitle="Create your free runner account with your email.">
      <form onSubmit={submit}>
        <label className="field">
          <span>Full name *</span>
          <input value={form.name} onChange={set("name")} autoComplete="name" required />
        </label>
        <label className="field">
          <span>Email *</span>
          <input type="email" value={form.email} onChange={set("email")} autoComplete="email" required />
        </label>
        <div className="form-row">
          <label className="field">
            <span>Phone</span>
            <input value={form.phone} onChange={set("phone")} inputMode="tel" placeholder="0771234567" autoComplete="tel" />
          </label>
          <label className="field">
            <span>Gender</span>
            <select value={form.gender} onChange={set("gender")}>
              <option value="">Prefer not to say</option>
              <option>Female</option>
              <option>Male</option>
            </select>
          </label>
        </div>
        <label className="field">
          <span>Date of birth</span>
          <input type="date" value={form.dateOfBirth} onChange={set("dateOfBirth")} />
        </label>
        <div className="form-row">
          <label className="field">
            <span>Password *</span>
            <input type="password" value={form.password} onChange={set("password")} minLength={6} autoComplete="new-password" required />
          </label>
          <label className="field">
            <span>Confirm password *</span>
            <input type="password" value={form.confirm} onChange={set("confirm")} autoComplete="new-password" required />
          </label>
        </div>
        {error && <p className="alert alert-error">{error}</p>}
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
      </form>
      <p className="center small">
        Already a member? <Link to={`/login?next=${encodeURIComponent(next)}`}>Log in</Link>
      </p>
    </AuthLayout>
  );
}
