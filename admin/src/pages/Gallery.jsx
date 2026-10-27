import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AdminPage, Toast } from "../components/ui.jsx";
import RunnerLoader from "../components/RunnerLoader.jsx";
import Img from "../components/Img.jsx";
import useFetch from "../useFetch.js";
import { api, formatDate, mediaUrl } from "../api.js";

export default function Gallery() {
  const [params, setParams] = useSearchParams();
  const raceId = params.get("raceId") || "";
  const races = useFetch("/admin/races");
  const photos = useFetch(`/gallery${raceId ? `?raceId=${raceId}` : ""}`);
  const [files, setFiles] = useState([]);
  const [caption, setCaption] = useState("");
  const [progress, setProgress] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [toast, setToast] = useState({ message: "", kind: "ok" });

  const previews = useMemo(() => files.map((f) => ({ name: f.name, url: URL.createObjectURL(f) })), [files]);
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.url)), [previews]);

  const addFiles = (list) => setFiles((cur) => [...cur, ...Array.from(list).filter((f) => f.type.startsWith("image/"))].slice(0, 30));

  // XHR so we can show upload progress with the runner bar.
  const upload = (e) => {
    e.preventDefault();
    if (!raceId) return setToast({ message: "Choose a race first.", kind: "error" });
    if (!files.length) return setToast({ message: "Add some photos first.", kind: "error" });
    const fd = new FormData();
    fd.append("raceId", raceId);
    fd.append("caption", caption);
    files.forEach((f) => fd.append("photos", f));

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${import.meta.env.VITE_API_URL || ""}/api/admin/gallery`);
    try { xhr.setRequestHeader("Authorization", `Bearer ${localStorage.getItem("mrpace_admin_token")}`); } catch { /* storage blocked */ }
    xhr.upload.onprogress = (ev) => ev.lengthComputable && setProgress(Math.round((ev.loaded / ev.total) * 100));
    xhr.onload = () => {
      setProgress(null);
      let data = {};
      try { data = JSON.parse(xhr.responseText); } catch { /* ignore */ }
      if (xhr.status >= 200 && xhr.status < 300) {
        setToast({ message: `${data.photos.length} photo(s) uploaded.`, kind: "ok" });
        setFiles([]);
        setCaption("");
        photos.reload();
      } else setToast({ message: data.message || "Upload failed.", kind: "error" });
    };
    xhr.onerror = () => {
      setProgress(null);
      setToast({ message: "Upload failed. Check your connection.", kind: "error" });
    };
    setProgress(0);
    xhr.send(fd);
  };

  const remove = async (p) => {
    if (!window.confirm("Delete this photo?")) return;
    try {
      await api(`/admin/gallery/${p.id}`, { method: "DELETE" });
      photos.setData((d) => ({ ...d, photos: d.photos.filter((x) => x.id !== p.id) }));
    } catch (e) {
      setToast({ message: e.message, kind: "error" });
    }
  };

  const editCaption = async (p) => {
    const next = window.prompt("Photo caption", p.caption || "");
    if (next === null) return;
    try {
      const d = await api(`/admin/gallery/${p.id}`, { method: "PATCH", body: { caption: next } });
      photos.setData((cur) => ({ ...cur, photos: cur.photos.map((x) => (x.id === p.id ? { ...x, caption: d.photo.caption } : x)) }));
    } catch (e) {
      setToast({ message: e.message, kind: "error" });
    }
  };

  return (
    <AdminPage title="Gallery" subtitle="Upload photos for each race. They appear on the website gallery and the race page.">
      <form className="admin-card upload-card" onSubmit={upload}>
        <div className="form-row">
          <label className="field">
            <span>Race *</span>
            <select value={raceId} onChange={(e) => setParams(e.target.value ? { raceId: e.target.value } : {})}>
              <option value="">— choose a race —</option>
              {races.data?.races.map((r) => <option key={r.id} value={r.id}>{r.title} ({formatDate(r.date)})</option>)}
            </select>
          </label>
          <label className="field">
            <span>Caption (optional, applies to all)</span>
            <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="e.g. Start line, 10km" />
          </label>
        </div>

        <label
          className={`dropzone ${dragging ? "is-drag" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
        >
          <input type="file" accept="image/*" multiple onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
          <b>📷 Drop photos here or tap to choose</b>
          <small className="muted">JPG, PNG or WEBP · up to 30 at a time · max 10MB each</small>
        </label>

        {previews.length > 0 && (
          <div className="preview-grid">
            <AnimatePresence>
              {previews.map((p, i) => (
                <motion.div key={p.url} className="preview" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                  <img src={p.url} alt={p.name} />
                  <button type="button" aria-label="Remove" onClick={() => setFiles(files.filter((_, j) => j !== i))}>✕</button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {progress != null ? (
          <RunnerLoader label="Uploading photos" progress={progress} />
        ) : (
          <button className="btn btn-primary" disabled={!files.length}>Upload {files.length || ""} photo{files.length === 1 ? "" : "s"}</button>
        )}
      </form>

      <h2 className="sub-title">{raceId ? "Photos for this race" : "All photos"}</h2>
      {photos.loading ? (
        <RunnerLoader label="Loading photos" />
      ) : photos.error ? (
        <p className="alert alert-error">{photos.error}</p>
      ) : photos.data.photos.length === 0 ? (
        <div className="empty"><p>No photos yet.</p></div>
      ) : (
        <motion.div className="admin-photos" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.03 } } }}>
          <AnimatePresence>
            {photos.data.photos.map((p) => (
              <motion.figure key={p.id} layout variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} exit={{ opacity: 0, scale: 0.8 }}>
                <Img src={mediaUrl(p.thumb || p.url)} alt={p.caption || p.raceTitle} />
                <figcaption>
                  <span className="small">{p.caption || <i className="muted">No caption</i>}</span>
                  {!raceId && <small className="muted">{p.raceTitle}</small>}
                  <div className="row-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => editCaption(p)}>Caption</button>
                    <button className="btn btn-ghost btn-sm danger" onClick={() => remove(p)}>Delete</button>
                  </div>
                </figcaption>
              </motion.figure>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
      <Toast message={toast.message} kind={toast.kind} onClose={() => setToast({ message: "", kind: "ok" })} />
    </AdminPage>
  );
}
