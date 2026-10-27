import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Logo from "./Logo.jsx";

// The sprinting runner from the Mr Pace logo, bobbing as it runs.
export function RunnerFigure({ className = "" }) {
  return <img src="/images/runner.png" alt="" aria-hidden="true" className={`runner-img ${className}`} draggable="false" />;
}

// "MR PACE" with each letter bouncing in turn, like a wave, while loading.
function WaveText() {
  const letters = [..."MR PACE"];
  return (
    <div className="rl-wave" aria-hidden="true">
      {letters.map((ch, i) =>
        ch === " " ? (
          <span key={i} className="rl-wave-gap" />
        ) : (
          <span key={i} className={i < 2 ? "rl-wave-red" : ""} style={{ animationDelay: `${i * 0.1}s` }}>
            {ch}
          </span>
        )
      )}
    </div>
  );
}

/**
 * Progress bar with the logo's runner racing along it to the finish.
 * - progress: 0-100. Leave it out and the bar creeps forward on its own.
 * - fullScreen: covers the whole page (used for the first load).
 */
export default function RunnerLoader({ label = "Loading", progress, fullScreen = false, compact = false }) {
  const [auto, setAuto] = useState(6);

  useEffect(() => {
    if (progress != null) return;
    const t = setInterval(() => setAuto((v) => v + (95 - v) * 0.07), 110);
    return () => clearInterval(t);
  }, [progress]);

  const p = Math.min(100, Math.max(0, progress ?? auto));

  const bar = (
    <div className={`rl ${compact ? "rl-compact" : ""}`}>
      <div
        className="rl-track"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(p)}
      >
        <div className="rl-lane" />
        <div className="rl-fill" style={{ width: `${p}%` }} />
        <div className="rl-runner" style={{ left: `${p}%` }}>
          <RunnerFigure />
        </div>
      </div>
      <div className={`rl-label ${fullScreen ? "rl-label-pct" : ""}`}>
        {!fullScreen && <span>{label}</span>}
        <b>{Math.round(p)}%</b>
      </div>
      {fullScreen && <WaveText />}
    </div>
  );

  if (!fullScreen) return <div className="rl-wrap">{bar}</div>;

  return (
    <motion.div
      className="rl-screen"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, y: -30, transition: { duration: 0.6, ease: [0.7, 0, 0.3, 1] } }}
    >
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
        <Logo size="lg" link={false} />
      </motion.div>
      {bar}
    </motion.div>
  );
}
