import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { AdminPage, Modal, StatusBadge, Toast } from "../components/ui.jsx";
import RunnerLoader from "../components/RunnerLoader.jsx";
import useFetch from "../useFetch.js";
import { api, formatDate, formatDateTime, money } from "../api.js";

const STATUSES = [
  ["", "All"],
  ["pending_verification", "Needs verification"],
  ["awaiting_payment", "Awaiting payment"],
  ["approved", "Approved"],
  ["rejected", "Rejected"],
];

const METHOD_LABEL = { ecocash: "EcoCash (Paynow)", onemoney: "OneMoney (Paynow)", web: "Paynow web", manual: "Manual", free: "Free race" };

function Detail({ reg, onChange, onToast }) {
  const [note, setNote] = useState(reg.adminNote || "");
  const [busy, setBusy] = useState("");

  const act = async (name, path, body) => {
    setBusy(name);
    try {
      const d = await api(path, { method: "POST", body });
      onChange(d.registration);
      if (d.message) onToast(d.message);
    } catch (e) {
      onToast(e.message, "error");
    } finally {
      setBusy("");
    }
  };

  const p = reg.payment || {};
  return (
    <div className="reg-detail">
      <div className="reg-detail-top">
        <StatusBadge status={reg.status} />
        {reg.checkedInAt && <span className="status st-ok"><i />Checked in {formatDateTime(reg.checkedInAt)}</span>}
      </div>

      <div className="detail-grid">
        <section>
          <h3>Runner</h3>
          <dl>
            <dt>Name</dt><dd>{reg.user?.name}</dd>
            <dt>Email</dt><dd><a href={`mailto:${reg.user?.email}`}>{reg.user?.email}</a></dd>
            <dt>Phone</dt><dd>{reg.user?.phone || "—"}</dd>
            <dt>Gender / DOB</dt><dd>{reg.user?.gender || "—"} / {reg.user?.dateOfBirth || "—"}</dd>
            <dt>Emergency</dt><dd>{reg.emergencyName || "—"} {reg.emergencyPhone && `(${reg.emergencyPhone})`}</dd>
            <dt>T-shirt</dt><dd>{reg.tshirtSize || "—"}</dd>
          </dl>
        </section>
        <section>
          <h3>Race</h3>
          <dl>
            <dt>Race</dt><dd>{reg.race?.title}</dd>
            <dt>Date</dt><dd>{reg.race && formatDate(reg.race.date)}</dd>
            <dt>Distance</dt><dd>{reg.distance}</dd>
            <dt>Fee</dt><dd><b>{money(reg.fee)}</b></dd>
            {reg.ticketCode && (<><dt>Ticket</dt><dd className="mono">{reg.ticketCode}</dd></>)}
            {reg.bibNumber && (<><dt>Bib</dt><dd><b>{reg.bibNumber}</b></dd></>)}
          </dl>
        </section>
        <section className="span-2 pay-section">
          <h3>Payment</h3>
          {!reg.payment ? (
            <p className="muted">The runner hasn't paid yet.</p>
          ) : (
            <dl>
              <dt>Method</dt><dd>{METHOD_LABEL[p.method] || p.method}{p.channel ? ` – ${p.channel}` : ""}</dd>
              {p.reference && (<><dt>Reference</dt><dd className="mono big-ref">{p.reference}</dd></>)}
              {p.merchantReference && (<><dt>Our ref</dt><dd className="mono">{p.merchantReference}</dd></>)}
              {p.payerPhone && (<><dt>Paid from</dt><dd>{p.payerPhone}</dd></>)}
              {p.submittedAt && (<><dt>Submitted</dt><dd>{formatDateTime(p.submittedAt)}</dd></>)}
              {p.paynowStatus && (<><dt>Paynow status</dt><dd>{p.paynowStatus}</dd></>)}
              <dt>Confirmed paid</dt>
              <dd>{p.paid ? <b className="ok">✓ Yes (confirmed by Paynow)</b> : p.method === "manual" ? "Check this reference in your EcoCash/bank statement" : "Not yet"}</dd>
            </dl>
          )}
          {["ecocash", "onemoney", "web"].includes(p.method) && !p.paid && (
            <button className="btn btn-outline btn-sm" disabled={!!busy} onClick={() => act("check", `/admin/registrations/${reg.id}/check-payment`)}>
              {busy === "check" ? "Checking…" : "Check with Paynow"}
            </button>
          )}
        </section>
      </div>

      {reg.ticketError && <p className="alert alert-error">Last email failed: {reg.ticketError}</p>}
      {reg.ticketSentAt && <p className="small muted">Ticket emailed {formatDateTime(reg.ticketSentAt)}{reg.approvedBy ? ` · approved by ${reg.approvedBy}` : ""}</p>}

      <label className="field">
        <span>Note to runner (shown if rejected)</span>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Reference not found in EcoCash statement" />
      </label>

      <div className="modal-actions">
        {reg.status !== "rejected" && reg.status !== "approved" && (
          <button className="btn btn-ghost danger" disabled={!!busy} onClick={() => act("reject", `/admin/registrations/${reg.id}/reject`, { note })}>
            {busy === "reject" ? "Rejecting…" : "Reject"}
          </button>
        )}
        {reg.status === "approved" ? (
          <button className="btn btn-outline" disabled={!!busy} onClick={() => act("approve", `/admin/registrations/${reg.id}/approve`, { note })}>
            {busy === "approve" ? "Sending…" : "Resend ticket email"}
          </button>
        ) : (
          <button className="btn btn-primary" disabled={!!busy} onClick={() => act("approve", `/admin/registrations/${reg.id}/approve`, { note })}>
            {busy === "approve" ? "Approving & emailing…" : "✓ Verify & send ticket"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function Registrations() {
  const [params, setParams] = useSearchParams();
  const status = params.get("status") || "";
  const raceId = params.get("raceId") || "";
  const query = new URLSearchParams({ ...(status && { status }), ...(raceId && { raceId }) }).toString();
  const { data, loading, error, setData } = useFetch(`/admin/registrations${query ? `?${query}` : ""}`);
  const races = useFetch("/admin/races");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState(null);
  const [toast, setToast] = useState({ message: "", kind: "ok" });

  const setFilter = (k, v) => {
    const next = new URLSearchParams(params);
    v ? next.set(k, v) : next.delete(k);
    setParams(next);
  };

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    const regs = data?.registrations || [];
    if (!q) return regs;
    return regs.filter((r) =>
      [r.user?.name, r.user?.email, r.user?.phone, r.payment?.reference, r.ticketCode, r.race?.title]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q))
    );
  }, [data, search]);

  const openReg = data?.registrations.find((r) => r.id === openId);

  const updateReg = (reg) => {
    setData((d) => ({ registrations: d.registrations.map((r) => (r.id === reg.id ? reg : r)) }));
  };

  return (
    <AdminPage title="Registrations" subtitle="Verify payments and send race tickets to runners.">
      <div className="filters">
        <div className="chips">
          {STATUSES.map(([v, label]) => (
            <button key={v} className={`chip ${status === v ? "is-active" : ""}`} onClick={() => setFilter("status", v)}>{label}</button>
          ))}
        </div>
        <div className="filter-row">
          <select value={raceId} onChange={(e) => setFilter("raceId", e.target.value)} aria-label="Filter by race">
            <option value="">All races</option>
            {races.data?.races.map((r) => <option key={r.id} value={r.id}>{r.title} ({formatDate(r.date)})</option>)}
          </select>
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, reference, ticket…" />
        </div>
      </div>

      {loading ? (
        <RunnerLoader label="Loading registrations" />
      ) : error ? (
        <p className="alert alert-error">{error}</p>
      ) : list.length === 0 ? (
        <div className="empty"><p>No registrations match.</p></div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Runner</th>
                <th>Race</th>
                <th>Fee</th>
                <th>Payment</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <motion.tbody initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.03 } } }}>
              {list.map((r) => (
                <motion.tr key={r.id} variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} onClick={() => setOpenId(r.id)}>
                  <td data-label="Runner"><b>{r.user?.name || "Deleted user"}</b><div className="small muted">{r.user?.email}</div></td>
                  <td data-label="Race">{r.race?.title}<div className="small muted">{r.distance}</div></td>
                  <td data-label="Fee">{money(r.fee)}</td>
                  <td data-label="Payment">
                    {r.payment ? (
                      <>
                        {METHOD_LABEL[r.payment.method] || r.payment.method}
                        <div className="small muted mono">{r.payment.reference || (r.payment.paid ? "Paid ✓" : "")}</div>
                      </>
                    ) : <span className="muted">—</span>}
                  </td>
                  <td data-label="Status"><StatusBadge status={r.status} /></td>
                  <td><button className="btn btn-sm btn-outline">Open</button></td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </div>
      )}

      <Modal open={Boolean(openReg)} onClose={() => setOpenId(null)} title="Registration" wide>
        {openReg && (
          <Detail
            key={openReg.id}
            reg={openReg}
            onChange={updateReg}
            onToast={(message, kind = "ok") => setToast({ message, kind })}
          />
        )}
      </Modal>
      <Toast message={toast.message} kind={toast.kind} onClose={() => setToast({ message: "", kind: "ok" })} />
    </AdminPage>
  );
}
