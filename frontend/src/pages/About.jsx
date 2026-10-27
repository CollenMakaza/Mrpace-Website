import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Page, Reveal, stagger, fadeUp } from "../components/Motion.jsx";
import Img from "../components/Img.jsx";
import { CLUB, IMAGES } from "../site.js";

const values = [
  ["🏃🏾", "Running only", "Everything we do is about running – training, racing and enjoying the road."],
  ["🤝🏾", "Community", "Rooted in Unit K Ext, Chitungwiza. Neighbours, friends and family running together."],
  ["⏱️", "Every pace", "From walk-run beginners to sub-3 marathoners, there's a group for you."],
  ["❤️", "Healthy living", "Running for fitness, mental health and a stronger community."],
];

export default function About() {
  return (
    <Page>
      <section className="page-hero">
        <Img src={IMAGES.about} alt="" className="page-hero-bg show-faces" />
        <div className="page-hero-overlay" />
        <div className="container">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>About Mr Pace</motion.h1>
          <p>{CLUB.tagline}</p>
        </div>
      </section>

      <section className="section">
        <div className="container split">
          <Reveal className="split-text">
            <span className="eyebrow">Our story</span>
            <h2>From the streets of <span className="red">Chitungwiza</span></h2>
            <p>
              Mr Pace Athletics Club is a running club based in Unit K Ext, Chitungwiza, Harare. We started with a small group of
              friends meeting for early morning runs and grew into a club that organises community races and supports runners
              of every level.
            </p>
            <p>
              Whether you're chasing a personal best, training for your first race, or just want company on the road, you'll find
              your pace with us.
            </p>
          </Reveal>
          <Reveal className="split-media" delay={0.1}>
            <div className="img-duo">
              <Img src={IMAGES.club[1]} alt="Mr Pace runners training" />
              <Img src={IMAGES.club[3]} alt="Mr Pace race day" />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <Reveal className="section-head center"><div><span className="eyebrow">What we stand for</span><h2>Our values</h2></div></Reveal>
          <motion.div className="values" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
            {values.map(([icon, t, d]) => (
              <motion.div key={t} variants={fadeUp} className="value" whileHover={{ y: -6 }}>
                <span className="value-icon">{icon}</span>
                <h3>{t}</h3>
                <p className="muted">{d}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="section">
        <div className="container contact-grid">
          <Reveal className="card">
            <h2>Get in touch</h2>
            <ul className="contact-list">
              <li><span>📍</span>{CLUB.location}</li>
              <li><span>✉️</span><a href={`mailto:${CLUB.email}`}>{CLUB.email}</a></li>
              <li><span>📞</span><a href={`tel:${CLUB.phone.replace(/\s/g, "")}`}>{CLUB.phone}</a></li>
              <li><span>💬</span><a href={`https://wa.me/${CLUB.whatsapp}`} target="_blank" rel="noreferrer">Chat on WhatsApp</a></li>
            </ul>
            <Link to="/signup" className="btn btn-primary">Join the club</Link>
          </Reveal>
          <Reveal className="map-card" delay={0.1}>
            <Img src={IMAGES.club[3]} alt="" className="map-card-bg" />
            <div className="map-card-body">
              <span className="eyebrow light">Where we run</span>
              <h3>Unit K Ext, Chitungwiza</h3>
              <p>Harare, Zimbabwe</p>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Unit+K+Chitungwiza+Zimbabwe"
                target="_blank"
                rel="noreferrer"
                className="btn btn-light"
              >
                📍 Open in Google Maps
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </Page>
  );
}
