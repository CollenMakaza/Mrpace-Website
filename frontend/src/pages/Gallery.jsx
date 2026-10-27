import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Page } from "../components/Motion.jsx";
import RunnerLoader from "../components/RunnerLoader.jsx";
import Lightbox from "../components/Lightbox.jsx";
import Img from "../components/Img.jsx";
import useFetch from "../useFetch.js";
import { formatDate, mediaUrl } from "../api.js";
import { IMAGES } from "../site.js";

const PAGE_SIZE = 60;

// "All photos" takes turns between races so every race shows up near the top.
function mixAlbums(list) {
  const byRace = new Map();
  list.forEach((p) => byRace.set(p.raceId, [...(byRace.get(p.raceId) || []), p]));
  const groups = [...byRace.values()];
  const out = [];
  for (let i = 0; out.length < list.length; i++) groups.forEach((g) => g[i] && out.push(g[i]));
  return out;
}

export default function Gallery() {
  const [params, setParams] = useSearchParams();
  const raceId = params.get("race") || "";
  const { data, loading, error } = useFetch(`/gallery${raceId ? `?raceId=${raceId}` : ""}`);
  const all = useFetch("/gallery?limit=1"); // keeps the album list stable while filtering
  const [lb, setLb] = useState(null);
  const [shown, setShown] = useState(PAGE_SIZE);

  useEffect(() => setShown(PAGE_SIZE), [raceId]);

  const albums = all.data?.albums || [];
  const photos = useMemo(() => (raceId ? data?.photos || [] : mixAlbums(data?.photos || [])), [data, raceId]);
  const album = albums.find((a) => a.id === raceId);

  return (
    <Page>
      <section className="page-hero">
        <Img src={IMAGES.club[2]} alt="" className="page-hero-bg" />
        <div className="page-hero-overlay" />
        <div className="container">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>Gallery</motion.h1>
          <p>Photos from every Mr Pace race – find yourself crossing the line.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {albums.length > 0 && (
            <div className="albums">
              <button className={`album-card ${!raceId ? "is-active" : ""}`} onClick={() => setParams({})}>
                <span className="album-all" />
                <span className="album-info"><b>All photos</b><small>{albums.reduce((n, a) => n + a.count, 0)} photos</small></span>
              </button>
              {albums.map((a) => (
                <button key={a.id} className={`album-card ${raceId === a.id ? "is-active" : ""}`} onClick={() => setParams({ race: a.id })}>
                  <Img src={mediaUrl(a.cover)} alt="" />
                  <span className="album-info">
                    <b>{a.title}</b>
                    <small>{formatDate(a.date)} · {a.count} photos</small>
                  </span>
                </button>
              ))}
            </div>
          )}

          {album && <h2 className="album-title">{album.title}</h2>}

          {loading ? (
            <RunnerLoader label="Loading photos" />
          ) : error ? (
            <p className="alert alert-error">{error}</p>
          ) : photos.length === 0 ? (
            <div className="empty">
              <p>No photos yet. Race photos will appear here after each event.</p>
            </div>
          ) : (
            <>
              <div className="masonry" key={raceId}>
                {photos.slice(0, shown).map((p, i) => (
                  <motion.button
                    key={p.id}
                    className="masonry-item"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.5, delay: (i % 4) * 0.06 }}
                    onClick={() => setLb(i)}
                  >
                    <Img src={mediaUrl(p.thumb || p.url)} alt={p.caption || p.raceTitle} />
                    <span className="masonry-cap">
                      <b>{p.raceTitle}</b>
                      {p.caption && <small>{p.caption}</small>}
                    </span>
                  </motion.button>
                ))}
              </div>
              {shown < photos.length && (
                <div className="center load-more">
                  <button className="btn btn-outline" onClick={() => setShown(shown + PAGE_SIZE)}>
                    Show more photos ({photos.length - shown} left)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Lightbox photos={photos} index={lb} onClose={() => setLb(null)} onChange={setLb} />
    </Page>
  );
}
