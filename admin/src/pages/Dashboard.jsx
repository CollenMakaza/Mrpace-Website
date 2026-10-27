import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AdminPage, StatusBadge } from "../components/ui.jsx";
import RunnerLoader from "../components/RunnerLoader.jsx";
import useFetch from "../useFetch.js";
import { formatDateTime, money } from "../api.js";
import { useAdmin } from "../AdminAuth.jsx";

export default function Dashboard() {
  const { admin } = useAdmin();
  const stats = useFetch("/admin/stats");
  const pending = useFetch("/admin/registrations?status=pending_verification");

  const cards = stats.data
    ? [
        { label: "Need verification", value: stats.data.pending, to: "/registrations?status=pending_verification", hot: stats.data.pending > 0 },
        { label: "Confirmed entries", value: stats.data.approved, to: "/registrations?status=approved" },
        { label: "Revenue (verified)", value: money(stats.data.revenue) },
        { label: "Awaiting payment", value: stats.data.awaitingPayment, to: "/registrations?status=awaiting_payment" },
        { label: "Upcoming races", value: stats.data.upcomingRaces, to: "/races" },
        { label: "Registered runners", value: stats.data.users, to: "/runners" },
        { label: "Gallery photos", value: stats.data.photos, to: "/gallery" },
        { label: "All races", value: stats.data.races, to: "/races" },
      ]
    : [];

  return (
    <AdminPage title={`Welcome back${admin.name ? `, ${admin.name.split(" ")[0]}` : ""}`} subtitle="Here's what's happening at Mr Pace.">
      {stats.loading ? (
        <RunnerLoader label="Loading stats" />
      ) : stats.error ? (
        <p className="alert alert-error">{stats.error}</p>
      ) : (
        <motion.div className="stat-grid" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }}>
          {cards.map((c) => {
            const inner = (
              <>
                <small>{c.label}</small>
                <b>{c.value}</b>
              </>
            );
            return (
              <motion.div key={c.label} variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} whileHover={{ y: -4 }}>
                {c.to ? (
                  <Link to={c.to} className={`stat ${c.hot ? "stat-hot" : ""}`}>{inner}</Link>
                ) : (
                  <div className="stat">{inner}</div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <div className="admin-card">
        <div className="admin-card-head">
          <h2>Waiting for your verification</h2>
          <Link to="/registrations?status=pending_verification" className="arrow-link">Open all →</Link>
        </div>
        {pending.loading ? (
          <RunnerLoader label="Loading registrations" compact />
        ) : pending.data?.registrations.length ? (
          <ul className="mini-list">
            {pending.data.registrations.slice(0, 6).map((r) => (
              <li key={r.id}>
                <div>
                  <b>{r.user?.name}</b>
                  <small className="muted"> · {r.race?.title} · {r.distance} · {money(r.fee)}</small>
                  <div className="small muted">
                    {r.payment?.method === "manual" ? `Ref: ${r.payment.reference}` : r.payment?.paid ? "Paid via Paynow" : r.payment?.method}
                    {r.payment?.submittedAt && ` · ${formatDateTime(r.payment.submittedAt)}`}
                  </div>
                </div>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">🎉 Nothing to verify right now.</p>
        )}
      </div>
    </AdminPage>
  );
}
