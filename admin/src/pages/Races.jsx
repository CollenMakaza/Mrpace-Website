import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AdminPage, Modal, Toast } from "../components/ui.jsx";
import RunnerLoader from "../components/RunnerLoader.jsx";
import Img from "../components/Img.jsx";
import useFetch from "../useFetch.js";
import { api, formatDateTime, mediaUrl, money } from "../api.js";
import { PUBLIC_SITE } from "../site.js";

const toLocalInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const blank = {
  title: "",
  date: "",
  location: "Unit K Ext, Chitungwiza",
  description: "",
  distances: [{ label: "5km", fee: 5 }, { label: "10km", fee: 10 }],
  capacity: "",
  registrationOpen: true,
  resultsText: "",
  resultsUrl: "",
};

function RaceForm({ race, onSaved, onCancel }) {
  const [form, setForm] = useState(() =>
    race
      ? { ...blank, ...race, date: toLocalInput(race.date), capacity: race.capacity || "" }
      : blank
  );
  const [cover, setCover] = useState(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const setDist = (i, k, v) => setForm({ ...form, distances: form.distances.map((d, j) => (j === i ? { ...d, [k]: v } : d)) });

  const preview = cover ? URL.createObjectURL(cover) : !removeCover && race?.coverImage ? mediaUrl(race.coverImage) : "";

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("date", form.date ? new Date(form.date).toISOString() : "");
    fd.append("location", form.location);
    fd.append("description", form.description);
    fd.append("distances", JSON.stringify(form.distances));
    fd.append("capacity", form.capacity || 0);
    fd.append("registrationOpen", form.registrationOpen);
    fd.append("resultsText", form.resultsText);
    fd.append("resultsUrl", form.resultsUrl);
    if (cover) fd.append("cover", cover);
    if (removeCover) fd.append("removeCover", "true");
    try {
      const d = await api(race ? `/admin/races/${race.id}` : "/admin/races", { method: race ? "PUT" : "POST", form: fd });
      onSaved(d.race, race ? "Race updated." : "Race created.");
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <label className="field">
        <span>Race name *</span>
        <input value={form.title} onChange={set("title")} placeholder="e.g. Chitungwiza 10k Fun Run" required />
      </label>
      <div className="form-row">
        <label className="field">
          <span>Date & start time *</span>
          <input type="datetime-local" value={form.date} onChange={set("date")} required />
        </label>
        <label className="field">
          <span>Location *</span>
          <input value={form.location} onChange={set("location")} required />
        </label>
      </div>
      <label className="field">
        <span>Description</span>
        <textarea rows={5} value={form.description} onChange={set("description")} placeholder="Route, start point, what's included (t-shirt, medal, water points)…" />
      </label>

      <fieldset className="field">
        <legend>Distances & entry fees (US$) *</legend>
        <div className="dist-rows">
          {form.distances.map((d, i) => (
            <div key={i} className="dist-row">
              <input value={d.label} onChange={(e) => setDist(i, "label", e.target.value)} placeholder="e.g. 21km" aria-label="Distance" />
              <input type="number" min="0" step="0.5" value={d.fee} onChange={(e) => setDist(i, "fee", e.target.value)} aria-label="Fee" />
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setForm({ ...form, distances: form.distances.filter((_, j) => j !== i) })} aria-label="Remove distance">✕</button>
            </div>
          ))}
        </div>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setForm({ ...form, distances: [...form.distances, { label: "", fee: 0 }] })}>
          + Add distance
        </button>
      </fieldset>

      <div className="form-row">
        <label className="field">
          <span>Max runners (blank = no limit)</span>
          <input type="number" min="0" value={form.capacity} onChange={set("capacity")} />
        </label>
        <label className="field switch-field">
          <span>Registration</span>
          <label className="switch">
            <input type="checkbox" checked={form.registrationOpen} onChange={set("registrationOpen")} />
            <i />
            {form.registrationOpen ? "Open" : "Closed"}
          </label>
        </label>
      </div>

      <div className="field">
        <span>Cover photo</span>
        <div className="cover-pick">
          {preview && <img src={preview} alt="" />}
          <div>
            <input type="file" accept="image/*" onChange={(e) => { setCover(e.target.files[0] || null); setRemoveCover(false); }} />
            {race?.coverImage && !cover && !removeCover && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRemoveCover(true)}>Remove cover</button>
            )}
          </div>
        </div>
      </div>

      <details className="results-box" open={Boolean(form.resultsText || form.resultsUrl)}>
        <summary>Results (for finished races)</summary>
        <label className="field">
          <span>Results / winners</span>
          <textarea rows={5} value={form.resultsText} onChange={set("resultsText")} placeholder={"10km Men: 1. T. Moyo 31:20\n10km Women: 1. R. Chikwanha 36:05"} />
        </label>
        <label className="field">
          <span>Link to full results</span>
          <input type="url" value={form.resultsUrl} onChange={set("resultsUrl")} placeholder="https://…" />
        </label>
      </details>

      {error && <p className="alert alert-error">{error}</p>}
      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : race ? "Save changes" : "Create race"}</button>
      </div>
    </form>
  );
}

export default function Races() {
  const { data, loading, error, reload } = useFetch("/admin/races");
  const [editing, setEditing] = useState(undefined); // undefined = closed, null = new, object = edit
  const [toast, setToast] = useState("");

  const remove = async (race) => {
    if (!window.confirm(`Delete "${race.title}"? This also deletes its ${race.spotsTaken} registrations and ${race.photoCount} photos.`)) return;
    try {
      await api(`/admin/races/${race.id}`, { method: "DELETE" });
      setToast("Race deleted.");
      reload();
    } catch (e) {
      setToast(e.message);
    }
  };

  return (
    <AdminPage
      title="Races"
      subtitle="Add upcoming races, update details and post results."
      actions={<button className="btn btn-primary" onClick={() => setEditing(null)}>+ New race</button>}
    >
      {loading ? (
        <RunnerLoader label="Loading races" />
      ) : error ? (
        <p className="alert alert-error">{error}</p>
      ) : data.races.length === 0 ? (
        <div className="empty"><p>No races yet. Create your first race!</p></div>
      ) : (
        <motion.div className="admin-race-list" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }}>
          {data.races.map((r) => (
            <motion.article key={r.id} className="admin-race" variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }} layout>
              <Img src={mediaUrl(r.coverImage)} alt="" className="admin-race-img" />
              <div className="admin-race-body">
                <div className="admin-race-top">
                  <h3>{r.title}</h3>
                  <span className={`tag ${r.isPast ? "tag-dark" : r.registrationOpen ? "tag-red" : "tag-dark"}`}>
                    {r.isPast ? "Finished" : r.registrationOpen ? "Open" : "Closed"}
                  </span>
                </div>
                <p className="muted small">📅 {formatDateTime(r.date)} · 📍 {r.location}</p>
                <p className="small">
                  {r.distances.map((d) => `${d.label} (${money(d.fee)})`).join(" · ")}
                </p>
                <p className="small muted">
                  {r.spotsTaken} registered{r.capacity ? ` / ${r.capacity}` : ""} · {r.photoCount} photos
                </p>
                <div className="row-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => setEditing(r)}>Edit</button>
                  <Link className="btn btn-ghost btn-sm" to={`/registrations?raceId=${r.id}`}>Registrations</Link>
                  <Link className="btn btn-ghost btn-sm" to={`/gallery?raceId=${r.id}`}>Photos</Link>
                  <a className="btn btn-ghost btn-sm" href={`${PUBLIC_SITE}/races/${r.id}`} target="_blank" rel="noreferrer">View</a>
                  <button className="btn btn-ghost btn-sm danger" onClick={() => remove(r)}>Delete</button>
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>
      )}

      <Modal open={editing !== undefined} onClose={() => setEditing(undefined)} title={editing ? "Edit race" : "New race"} wide>
        {editing !== undefined && (
          <RaceForm
            key={editing?.id || "new"}
            race={editing}
            onCancel={() => setEditing(undefined)}
            onSaved={(_, msg) => {
              setEditing(undefined);
              setToast(msg);
              reload();
            }}
          />
        )}
      </Modal>
      <Toast message={toast} onClose={() => setToast("")} />
    </AdminPage>
  );
}
