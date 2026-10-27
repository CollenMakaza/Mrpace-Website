import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "./AuthLayout.jsx";
import { useAuth } from "../AuthContext.jsx";

export default function Login() {
  const { user, login } = useAuth();
  const [params] = useSearchParams();
  const next = params.get("next") || "/my-races";
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={next} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      navigate(next, { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to register for races and see your tickets.">
      <form onSubmit={submit}>
        <label className="field">
          <span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </label>
        <label className="field">
          <span>Password</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </label>
        {error && <p className="alert alert-error">{error}</p>}
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? "Logging in…" : "Log in"}</button>
      </form>
      <p className="center small">
        New to Mr Pace? <Link to={`/signup?next=${encodeURIComponent(next)}`}>Create an account</Link>
      </p>
    </AuthLayout>
  );
}
