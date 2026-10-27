import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { mediaUrl } from "../api.js";

export default function Lightbox({ photos, index, onClose, onChange }) {
  const open = index != null && photos[index];

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onChange((index + 1) % photos.length);
      if (e.key === "ArrowLeft") onChange((index - 1 + photos.length) % photos.length);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, index, photos.length, onClose, onChange]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="lightbox" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <button className="lb-close" aria-label="Close" onClick={onClose}>✕</button>
          {photos.length > 1 && (
            <>
              <button className="lb-nav lb-prev" aria-label="Previous" onClick={(e) => { e.stopPropagation(); onChange((index - 1 + photos.length) % photos.length); }}>‹</button>
              <button className="lb-nav lb-next" aria-label="Next" onClick={(e) => { e.stopPropagation(); onChange((index + 1) % photos.length); }}>›</button>
            </>
          )}
          <AnimatePresence mode="wait">
            <motion.figure
              key={photos[index].id}
              className="lb-figure"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(e, info) => {
                if (info.offset.x < -80) onChange((index + 1) % photos.length);
                if (info.offset.x > 80) onChange((index - 1 + photos.length) % photos.length);
              }}
            >
              <img src={mediaUrl(photos[index].url)} alt={photos[index].caption || photos[index].raceTitle || "Race photo"} />
              <figcaption>
                {photos[index].caption || photos[index].raceTitle}
                <span>{index + 1} / {photos.length}</span>
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
