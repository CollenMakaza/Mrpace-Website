import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Page, Reveal, stagger, fadeUp } from "../components/Motion.jsx";
import RaceCard from "../components/RaceCard.jsx";
import RunnerLoader from "../components/RunnerLoader.jsx";
import Countdown from "../components/Countdown.jsx";
import Img from "../components/Img.jsx";
import useFetch from "../useFetch.js";
import { formatDate, formatTime, mediaUrl } from "../api.js";
import { CLUB, IMAGES } from "../site.js";
import { useAuth } from "../AuthContext.jsx";

function HeroSlides() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % IMAGES.hero.length), 6000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="hero-slides" aria-hidden="true">
      <AnimatePresence>
        <motion.div
          key={i}
          className="hero-slide"
          initial={{ opacity: 0, scale: 1.12 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ opacity: { duration: 1.2 }, scale: { duration: 7, ease: "linear" } }}
        >
          <Img src={IMAGES.hero[i]} alt="" />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

const words = ["Run", "with", "pace."];

export default function Home() {
  const { user } = useAuth();
  const upcoming = useFetch("/races?when=upcoming&limit=3");
  const recent = useFetch("/races?when=recent&limit=3");
  const gallery = useFetch("/gallery?limit=8");
  const next = upcoming.data?.races?.[0];

  return (
    <Page className="home">
      {/* ---------- HERO ---------- */}
      <section className="hero">
        <HeroSlides />
        <div className="hero-overlay" />
        <div className="container hero-content">
          <motion.p className="eyebrow light" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            Athletics Club · Chitungwiza, Harare
          </motion.p>
          <h1 className="hero-title">
            {words.map((w, idx) => (
              <motion.span
                key={w}
                initial={{ opacity: 0, y: 60, rotate: 4 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                transition={{ delay: 0.3 + idx * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className={idx === 2 ? "red" : ""}
              >
                {w}{" "}
              </motion.span>
            ))}
            <motion.span className="hero-sub-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
              Run with purpose.
            </motion.span>
          </h1>
          <motion.p className="hero-lead" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
            Mr Pace is a running-only club from Unit K Ext, Chitungwiza. Find upcoming races, register online, pay with EcoCash
            and get your race ticket straight to your email.
          </motion.p>
          <motion.div className="hero-cta" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.05 }}>
            <Link to="/races" className="btn btn-primary btn-lg">See upcoming races</Link>
            {!user && <Link to="/signup" className="btn btn-light btn-lg">Join the club</Link>}
          </motion.div>
        </div>
      </section>

      {/* ---------- NEXT RACE ---------- */}
      {next && (
        <section className="next-race-wrap container">
          <Reveal className="next-race">
            <div className="next-race-info">
              <span className="eyebrow">Next race</span>
              <h2>{next.title}</h2>
              <p className="muted">📍 {next.location} · {formatDate(next.date, { weekday: "long" })} · {formatTime(next.date)}</p>
            </div>
            <Countdown date={next.date} />
            <Link to={`/races/${next.id}`} className="btn btn-primary">
              {next.canRegister ? "Register now" : "View race"}
            </Link>
          </Reveal>
        </section>
      )}

      {/* ---------- UPCOMING ---------- */}
      <section className="section">
        <div className="container">
          <Reveal className="section-head">
            <div>
              <span className="eyebrow">On the calendar</span>
              <h2>Upcoming races</h2>
            </div>
            <Link to="/races" className="arrow-link">All races →</Link>
          </Reveal>
          {upcoming.loading ? (
            <RunnerLoader label="Finding races" />
          ) : upcoming.error ? (
            <p className="alert alert-error">{upcoming.error}</p>
          ) : upcoming.data.races.length ? (
            <motion.div className="race-grid" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
              {upcoming.data.races.map((r) => <RaceCard key={r.id} race={r} />)}
            </motion.div>
          ) : (
            <div className="empty">
              <p>New races are coming soon. Check back shortly!</p>
            </div>
          )}
        </div>
      </section>

      {/* ---------- ABOUT ---------- */}
      <section className="section section-alt">
        <div className="container split">
          <Reveal className="split-media">
            <div className="img-stack">
              <Img src={IMAGES.about} alt="Mr Pace runners" className="img-main" />
              <Img src={IMAGES.club[0]} alt="Mr Pace club run" className="img-float" />
              <div className="badge-circle"><b>RUN</b><span>Chitungwiza</span></div>
            </div>
          </Reveal>
          <Reveal className="split-text" delay={0.1}>
            <span className="eyebrow">Who we are</span>
            <h2>A club built for runners – <span className="red">every pace welcome</span></h2>
            <p>
              Mr Pace Athletics Club focuses only on running. We train together on the streets of Chitungwiza, organise community
              races, and help runners go from their very first 5k to the full marathon.
            </p>
            <ul className="checks">
              <li>Weekly group runs for beginners and seasoned athletes</li>
              <li>Community races from 5km to 42km</li>
              <li>Coaching on pacing, endurance and race-day prep</li>
            </ul>
            <Link to="/about" className="btn btn-outline">More about the club</Link>
          </Reveal>
        </div>
      </section>

      {/* ---------- HOW IT WORKS ---------- */}
      <section className="section">
        <div className="container">
          <Reveal className="section-head center">
            <div>
              <span className="eyebrow">Race entry made simple</span>
              <h2>From sign-up to start line</h2>
            </div>
          </Reveal>
          <motion.ol className="how" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}>
            {[
              ["Sign up", "Create your free Mr Pace account with your email."],
              ["Pick a race", "Choose an upcoming race and your distance."],
              ["Pay", "Pay with EcoCash, OneMoney or other methods."],
              ["Get your ticket", "We verify your payment and email your race ticket."],
            ].map(([t, d], idx) => (
              <motion.li key={t} variants={fadeUp}>
                <span className="how-num">{String(idx + 1).padStart(2, "0")}</span>
                <h3>{t}</h3>
                <p className="muted">{d}</p>
              </motion.li>
            ))}
          </motion.ol>
        </div>
      </section>

      {/* ---------- RECENT ---------- */}
      {recent.data?.races?.length > 0 && (
        <section className="section section-dark">
          <div className="container">
            <Reveal className="section-head">
              <div>
                <span className="eyebrow">Results & memories</span>
                <h2>Recent races</h2>
              </div>
              <Link to="/races?tab=recent" className="arrow-link">See all →</Link>
            </Reveal>
            <motion.div className="race-grid" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
              {recent.data.races.map((r) => <RaceCard key={r.id} race={r} />)}
            </motion.div>
          </div>
        </section>
      )}

      {/* ---------- GALLERY PREVIEW ---------- */}
      <section className="section">
        <div className="container">
          <Reveal className="section-head">
            <div>
              <span className="eyebrow">Gallery</span>
              <h2>Moments on the road</h2>
            </div>
            <Link to="/gallery" className="arrow-link">Open gallery →</Link>
          </Reveal>
          {gallery.loading ? (
            <RunnerLoader label="Loading photos" />
          ) : (
            <motion.div className="mosaic" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
              {[
                ...(gallery.data?.albums || []).map((a) => ({ src: mediaUrl(a.cover), to: `/gallery?race=${a.id}`, label: a.title })),
                ...[IMAGES.hero[2], IMAGES.club[0], IMAGES.club[3], IMAGES.cta].map((src) => ({ src, to: "/gallery" })),
              ]
                .slice(0, 7)
                .map((item, idx) => (
                  <motion.div key={item.src + idx} variants={fadeUp} className={`mosaic-item m${idx}`}>
                    <Link to={item.to}>
                      <Img src={item.src} alt={item.label || "Mr Pace race photo"} />
                      {item.label && <span className="mosaic-label">{item.label}</span>}
                    </Link>
                  </motion.div>
                ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="cta">
        <Img src={IMAGES.cta} alt="" className="cta-bg" />
        <div className="cta-overlay" />
        <Reveal className="container cta-inner">
          <h2>Ready to find your pace?</h2>
          <p>Join {CLUB.fullName} and be part of Chitungwiza's running family.</p>
          <div className="hero-cta">
            {user ? (
              <Link to="/races" className="btn btn-light btn-lg">Register for a race</Link>
            ) : (
              <Link to="/signup" className="btn btn-light btn-lg">Create free account</Link>
            )}
          </div>
        </Reveal>
      </section>
    </Page>
  );
}
