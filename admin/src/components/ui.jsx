import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

export function AdminPage({ title, subtitle, actions, children }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }}
      exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
    >
      <div className="admin-head">
        <div>
          <h1>{title}</h1>
          {subtitle && <p className="muted">{subtitle}</p>}
        </div>
        {actions && <div className="admin-head-actions">{actions}</div>}
      </div>
      {children}
    </motion.section>
  );
}

export function Modal({ open, onClose, title, children, wide }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="modal-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
          <motion.div
            className={`modal ${wide ? "modal-wide" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <h2>{title}</h2>
              <button className="modal-x" aria-label="Close" onClick={onClose}>✕</button>
            </div>
            <div className="modal-body">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Toast({ message, kind = "ok", onClose }) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => closeRef.current(), 4500);
    return () => clearTimeout(t);
  }, [message]);
  return (
    <AnimatePresence>
      {message && (
        <motion.div className={`toast toast-${kind}`} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} onClick={onClose}>
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const STATUS = {
  awaiting_payment: ["Awaiting payment", "st-wait"],
  pending_verification: ["Needs verification", "st-pending"],
  approved: ["Approved", "st-ok"],
  rejected: ["Rejected", "st-bad"],
};

export function StatusBadge({ status }) {
  const [text, cls] = STATUS[status] || [status, ""];
  return <span className={`status ${cls}`}><i />{text}</span>;
}
