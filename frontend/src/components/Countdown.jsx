import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

function parts(target) {
  const ms = Math.max(0, new Date(target) - Date.now());
  return {
    Days: Math.floor(ms / 86400000),
    Hours: Math.floor((ms / 3600000) % 24),
    Mins: Math.floor((ms / 60000) % 60),
    Secs: Math.floor((ms / 1000) % 60),
  };
}

export default function Countdown({ date }) {
  const [t, setT] = useState(() => parts(date));
  useEffect(() => {
    const id = setInterval(() => setT(parts(date)), 1000);
    return () => clearInterval(id);
  }, [date]);

  return (
    <div className="countdown">
      {Object.entries(t).map(([k, v]) => (
        <div key={k} className="cd-cell">
          <div className="cd-num">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={v}
                initial={{ y: "-100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {String(v).padStart(2, "0")}
              </motion.span>
            </AnimatePresence>
          </div>
          <small>{k}</small>
        </div>
      ))}
    </div>
  );
}
