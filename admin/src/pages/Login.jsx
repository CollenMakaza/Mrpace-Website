import { useState } from "react";
import { motion } from "framer-motion";
import Logo from "../components/Logo.jsx";
import { useAdmin } from "../AdminAuth.jsx";

export default function Login() {
  const { login } = useAdmin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="admin-login">
      <motion.form className="card admin-login-card" onSubmit={submit} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
        <div className="center"><Logo link={false} size="lg" /></div>
        <h1>Admin login</h1>
        <p className="muted">Manage races, registrations, payments and the gallery.</p>
        <label className="field">
          <span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
        </label>
        <label className="field">
          <span>Password</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </label>
        {error && <p className="alert alert-error">{error}</p>}
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      </motion.form>
    </div>
  );
}
