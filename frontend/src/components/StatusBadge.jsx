const LABELS = {
  awaiting_payment: { text: "Awaiting payment", cls: "st-wait" },
  pending_verification: { text: "Being verified", cls: "st-pending" },
  approved: { text: "Confirmed – ticket sent", cls: "st-ok" },
  rejected: { text: "Not verified", cls: "st-bad" },
};

export default function StatusBadge({ status }) {
  const s = LABELS[status] || { text: status, cls: "" };
  return <span className={`status ${s.cls}`}><i />{s.text}</span>;
}

// The four steps a runner goes through.
export function StatusSteps({ status }) {
  const order = ["registered", "paid", "verified", "ticket"];
  const reached =
    status === "approved" ? 4 : status === "pending_verification" ? 2 : status === "rejected" ? 1 : 1;
  const labels = { registered: "Registered", paid: "Paid", verified: "Verified", ticket: "Ticket emailed" };
  return (
    <ol className="steps">
      {order.map((k, i) => (
        <li key={k} className={i < reached ? "done" : i === reached ? "current" : ""}>
          <span>{i + 1}</span>
          {labels[k]}
        </li>
      ))}
    </ol>
  );
}
