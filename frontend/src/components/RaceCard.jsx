import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Img from "./Img.jsx";
import { fadeUp } from "./Motion.jsx";
import { formatDate, mediaUrl, money } from "../api.js";

export default function RaceCard({ race }) {
  const d = new Date(race.date);
  const fees = (race.distances || []).map((x) => Number(x.fee) || 0);
  const minFee = fees.length ? Math.min(...fees) : 0;

  return (
    <motion.article variants={fadeUp} className="race-card" whileHover={{ y: -6 }}>
      <Link to={`/races/${race.id}`} className="race-card-link">
        <div className="race-card-media">
          <Img src={mediaUrl(race.coverImage)} alt={race.title} />
          <div className="race-date-chip">
            <b>{d.getDate()}</b>
            <span>{d.toLocaleString("en-GB", { month: "short" })}</span>
          </div>
          {race.isPast ? (
            <span className="tag tag-dark">Completed</span>
          ) : race.canRegister ? (
            <span className="tag tag-red">Registration open</span>
          ) : (
            <span className="tag tag-dark">Registration closed</span>
          )}
        </div>
        <div className="race-card-body">
          <h3>{race.title}</h3>
          <p className="muted race-meta">
            📍 {race.location} · {formatDate(race.date, { weekday: "short" })}
          </p>
          <div className="distance-pills">
            {(race.distances || []).map((x) => (
              <span key={x.label} className="pill">{x.label}</span>
            ))}
          </div>
          <div className="race-card-foot">
            {race.isPast ? (
              <span className="muted">{race.photoCount ? `📷 ${race.photoCount} photos` : "View results"}</span>
            ) : (
              <span>From <b>{money(minFee)}</b></span>
            )}
            <span className="arrow-link">Details →</span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
