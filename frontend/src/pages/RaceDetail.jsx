import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Page, Reveal, stagger, fadeUp } from "../components/Motion.jsx";
import RunnerLoader from "../components/RunnerLoader.jsx";
import Countdown from "../components/Countdown.jsx";
import Img from "../components/Img.jsx";
import Lightbox from "../components/Lightbox.jsx";
import useFetch from "../useFetch.js";
import { formatDate, formatTime, mediaUrl, money } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import { IMAGES } from "../site.js";
import NotFound from "./NotFound.jsx";

export default function RaceDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data, loading, error } = useFetch(`/races/${id}`);
  const [lb, setLb] = useState(null);

  if (loading) return <div className="page-loader"><RunnerLoader label="Loading race" /></div>;
  if (error) return <NotFound message={error} />;

  const { race, photos } = data;
  const registerPath = `/races/${race.id}/register`;

  return (
    <Page>
      <section className="race-hero">
        <Img src={mediaUrl(race.coverImage) || IMAGES.hero[0]} alt={race.title} className="race-hero-bg" />
        <div className="page-hero-overlay" />
        <div className="container race-hero-inner">
          <Link to={race.isPast ? "/races?tab=recent" : "/races"} className="back-link">← All races</Link>
          <motion.span className={`tag ${race.isPast ? "tag-dark" : "tag-red"}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {race.isPast ? "Completed" : race.canRegister ? "Registration open" : "Registration closed"}
          </motion.span>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            {race.title}
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="race-hero-meta">
            <span>📅 {formatDate(race.date, { weekday: "long" })}</span>
            <span>⏰ {formatTime(race.date)}</span>
            <span>📍 {race.location}</span>
          </motion.p>
        </div>
      </section>

      <section className="section">
        <div className="container race-layout">
          <div className="race-main">
            {!race.isPast && (
              <Reveal className="card countdown-card">
                <h3>Race starts in</h3>
                <Countdown date={race.date} />
              </Reveal>
            )}

            <Reveal className="prose">
              <h2>About this race</h2>
              {(race.description || "Details coming soon.").split("\n").map((p, i) => p.trim() && <p key={i}>{p}</p>)}
            </Reveal>

            {race.isPast && (race.resultsText || race.resultsUrl) && (
              <Reveal className="card results-card">
                <h2>Results</h2>
                {race.resultsText && <pre className="results-text">{race.resultsText}</pre>}
                {race.resultsUrl && (
                  <a href={race.resultsUrl} target="_blank" rel="noreferrer" className="btn btn-outline">Full results →</a>
                )}
              </Reveal>
            )}

            {photos.length > 0 && (
              <div className="race-photos">
                <Reveal><h2>Photos ({photos.length})</h2></Reveal>
                <motion.div className="photo-grid" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
                  {photos.slice(0, 24).map((p, i) => (
                    <motion.button key={p.id} variants={fadeUp} className="photo-tile" onClick={() => setLb(i)} whileHover={{ scale: 1.03 }}>
                      <Img src={mediaUrl(p.thumb || p.url)} alt={p.caption || race.title} />
                    </motion.button>
                  ))}
                </motion.div>
                {photos.length > 24 && (
                  <div className="photo-grid-more">
                    <Link to={`/gallery?race=${race.id}`} className="btn btn-outline">See all {photos.length} photos →</Link>
                  </div>
                )}
              </div>
            )}
          </div>

          <aside className="race-side">
            <Reveal className="card sticky-card" delay={0.1}>
              <h3>{race.isPast ? "Distances" : "Distances & fees"}</h3>
              <ul className="fee-list">
                {race.distances.map((d) => (
                  <li key={d.label}>
                    <span className="pill">{d.label}</span>
                    {!race.isPast && <b>{money(d.fee)}</b>}
                  </li>
                ))}
              </ul>
              {race.isPast && photos.length > 0 && (
                <Link to={`/gallery?race=${race.id}`} className="btn btn-primary btn-block">📷 View {photos.length} race photos</Link>
              )}
              {race.capacity > 0 && !race.isPast && (
                <div className="capacity">
                  <div className="capacity-bar">
                    <motion.span
                      initial={{ width: 0 }}
                      whileInView={{ width: `${Math.min(100, (race.spotsTaken / race.capacity) * 100)}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                  <small className="muted">{race.spotsLeft} of {race.capacity} spots left</small>
                </div>
              )}
              {race.canRegister ? (
                <Link to={user ? registerPath : `/login?next=${encodeURIComponent(registerPath)}`} className="btn btn-primary btn-block">
                  {user ? "Register for this race" : "Log in to register"}
                </Link>
              ) : (
                <button className="btn btn-block" disabled>
                  {race.isPast ? "This race has finished" : "Registration closed"}
                </button>
              )}
              {!user && race.canRegister && (
                <p className="small muted center">New here? <Link to={`/signup?next=${encodeURIComponent(registerPath)}`}>Create an account</Link></p>
              )}
            </Reveal>
          </aside>
        </div>
      </section>

      <Lightbox photos={photos} index={lb} onClose={() => setLb(null)} onChange={setLb} />
    </Page>
  );
}
