const router = require("express").Router();
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const db = require("../db");
const { sign, requireAdmin } = require("../middleware/auth");
const { upload, deleteUpload } = require("../middleware/upload");
const { sendTicketEmail, sendRejectionEmail } = require("../utils/ticket");
const { serializeRace } = require("./races");
const { refreshPaynow, withRace } = require("./registrations");

const publicAdmin = ({ passwordHash, ...a }) => a;
const publicUser = ({ passwordHash, ...u }) => u;

// ---------- auth ----------
router.post("/login", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const admin = db.find("admins", (a) => a.email === email);
  if (!admin || !(await bcrypt.compare(String(req.body.password || ""), admin.passwordHash))) {
    return res.status(401).json({ message: "Wrong admin email or password." });
  }
  res.json({ token: sign({ id: admin.id, role: "admin" }), admin: publicAdmin(admin) });
});

router.use(requireAdmin);

router.get("/me", (req, res) => res.json({ admin: publicAdmin(req.admin) }));

router.put("/password", async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!(await bcrypt.compare(String(currentPassword || ""), req.admin.passwordHash))) {
    return res.status(400).json({ message: "Current password is wrong." });
  }
  if (String(newPassword || "").length < 8) return res.status(400).json({ message: "New password must be at least 8 characters." });
  db.update("admins", req.admin.id, { passwordHash: await bcrypt.hash(newPassword, 10) });
  res.json({ ok: true });
});

// ---------- dashboard ----------
router.get("/stats", (req, res) => {
  const regs = db.all("registrations");
  const nowTime = Date.now();
  const revenue = regs.filter((r) => r.status === "approved").reduce((sum, r) => sum + (Number(r.fee) || 0), 0);
  res.json({
    users: db.all("users").length,
    races: db.all("races").length,
    upcomingRaces: db.filter("races", (r) => new Date(r.date).getTime() >= nowTime).length,
    photos: db.all("photos").length,
    registrations: regs.length,
    pending: regs.filter((r) => r.status === "pending_verification").length,
    awaitingPayment: regs.filter((r) => r.status === "awaiting_payment").length,
    approved: regs.filter((r) => r.status === "approved").length,
    revenue,
  });
});

router.get("/users", (req, res) => {
  const users = db
    .all("users")
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((u) => ({ ...publicUser(u), registrations: db.filter("registrations", (r) => r.userId === u.id).length }));
  res.json({ users });
});

// ---------- races ----------
function parseRaceBody(body) {
  let distances = [];
  try {
    distances = typeof body.distances === "string" ? JSON.parse(body.distances) : body.distances || [];
  } catch {
    distances = [];
  }
  distances = distances
    .map((d) => ({ label: String(d.label || "").trim(), fee: Math.max(0, Number(d.fee) || 0) }))
    .filter((d) => d.label);

  const date = new Date(body.date || "");
  return {
    title: String(body.title || "").trim(),
    description: String(body.description || "").trim(),
    date: isNaN(date) ? "" : date.toISOString(),
    location: String(body.location || "").trim(),
    distances,
    capacity: Number(body.capacity) || 0,
    registrationOpen: String(body.registrationOpen) !== "false",
    resultsText: String(body.resultsText || "").trim(),
    resultsUrl: String(body.resultsUrl || "").trim(),
  };
}

function validateRace(data) {
  if (!data.title) return "Race title is required.";
  if (!data.date || isNaN(new Date(data.date))) return "A valid race date is required.";
  if (!data.location) return "Location is required.";
  if (!data.distances.length) return "Add at least one distance (e.g. 5km, 10km).";
  return null;
}

router.get("/races", (req, res) => {
  const races = db.all("races").slice().sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json({ races: races.map(serializeRace) });
});

router.post("/races", upload.single("cover"), (req, res) => {
  const data = parseRaceBody(req.body);
  const error = validateRace(data);
  if (error) {
    if (req.file) deleteUpload(`/uploads/${req.file.filename}`);
    return res.status(400).json({ message: error });
  }
  const race = db.insert("races", { ...data, coverImage: req.file ? `/uploads/${req.file.filename}` : "", nextBib: 101 });
  res.status(201).json({ race: serializeRace(race) });
});

router.put("/races/:id", upload.single("cover"), (req, res) => {
  const race = db.get("races", req.params.id);
  if (!race) return res.status(404).json({ message: "Race not found." });
  const data = parseRaceBody(req.body);
  const error = validateRace(data);
  if (error) return res.status(400).json({ message: error });
  if (req.file) {
    deleteUpload(race.coverImage);
    data.coverImage = `/uploads/${req.file.filename}`;
  } else if (req.body.removeCover === "true") {
    deleteUpload(race.coverImage);
    data.coverImage = "";
  }
  res.json({ race: serializeRace(db.update("races", race.id, data)) });
});

router.delete("/races/:id", (req, res) => {
  const race = db.get("races", req.params.id);
  if (!race) return res.status(404).json({ message: "Race not found." });
  deleteUpload(race.coverImage);
  db.filter("photos", (p) => p.raceId === race.id).forEach((p) => {
    deleteUpload(p.url);
    deleteUpload(p.thumb);
  });
  db.removeWhere("photos", (p) => p.raceId === race.id);
  db.removeWhere("registrations", (r) => r.raceId === race.id);
  db.remove("races", race.id);
  res.json({ ok: true });
});

// ---------- registrations ----------
function adminView(reg) {
  const user = db.get("users", reg.userId);
  return { ...withRace(reg), user: user ? publicUser(user) : null };
}

router.get("/registrations", (req, res) => {
  let regs = db.all("registrations").slice();
  if (req.query.status) regs = regs.filter((r) => r.status === req.query.status);
  if (req.query.raceId) regs = regs.filter((r) => r.raceId === req.query.raceId);
  regs.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
  res.json({ registrations: regs.map(adminView) });
});

router.post("/registrations/:id/check-payment", async (req, res) => {
  const reg = db.get("registrations", req.params.id);
  if (!reg) return res.status(404).json({ message: "Registration not found." });
  res.json({ registration: adminView(await refreshPaynow(reg)) });
});

function newTicketCode() {
  let code;
  do {
    code = `MP-${crypto.randomBytes(2).toString("hex").toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
  } while (db.find("registrations", (r) => r.ticketCode === code));
  return code;
}

router.post("/registrations/:id/approve", async (req, res) => {
  const reg = db.get("registrations", req.params.id);
  if (!reg) return res.status(404).json({ message: "Registration not found." });
  const race = db.get("races", reg.raceId);
  const user = db.get("users", reg.userId);
  if (!race || !user) return res.status(400).json({ message: "Race or runner no longer exists." });

  let updated = reg;
  if (reg.status !== "approved") {
    const bib = race.nextBib || 101;
    db.update("races", race.id, { nextBib: bib + 1 });
    updated = db.update("registrations", reg.id, {
      status: "approved",
      ticketCode: reg.ticketCode || newTicketCode(),
      bibNumber: reg.bibNumber || String(bib),
      approvedAt: new Date().toISOString(),
      approvedBy: req.admin.email,
      adminNote: String(req.body.note || ""),
      payment: { ...(reg.payment || {}), verified: true },
    });
  }

  try {
    await sendTicketEmail({ registration: updated, race, user });
    updated = db.update("registrations", reg.id, { ticketSentAt: new Date().toISOString(), ticketError: "" });
    res.json({ registration: adminView(updated), message: `Approved. Ticket sent to ${user.email}.` });
  } catch (err) {
    console.error("[mail] ticket failed:", err.message);
    updated = db.update("registrations", reg.id, { ticketError: err.message });
    res.json({ registration: adminView(updated), message: `Approved, but the email failed: ${err.message}` });
  }
});

router.post("/registrations/:id/reject", async (req, res) => {
  const reg = db.get("registrations", req.params.id);
  if (!reg) return res.status(404).json({ message: "Registration not found." });
  const updated = db.update("registrations", reg.id, {
    status: "rejected",
    adminNote: String(req.body.note || "").trim(),
  });
  const race = db.get("races", reg.raceId);
  const user = db.get("users", reg.userId);
  if (race && user) sendRejectionEmail({ registration: updated, race, user }).catch((e) => console.error("[mail]", e.message));
  res.json({ registration: adminView(updated), message: "Registration rejected and runner notified." });
});

router.delete("/registrations/:id", (req, res) => {
  if (!db.remove("registrations", req.params.id)) return res.status(404).json({ message: "Registration not found." });
  res.json({ ok: true });
});

// Race-day check-in by ticket code (from the QR code or typed in)
router.post("/checkin", (req, res) => {
  const code = String(req.body.ticketCode || "").trim().toUpperCase();
  const reg = db.find("registrations", (r) => r.ticketCode === code);
  if (!reg) return res.status(404).json({ message: "No ticket found with that code." });
  if (reg.status !== "approved") return res.status(400).json({ message: "This ticket has not been approved." });
  const already = reg.checkedInAt;
  const updated = already ? reg : db.update("registrations", reg.id, { checkedInAt: new Date().toISOString() });
  res.json({
    registration: adminView(updated),
    message: already ? `Already checked in at ${new Date(already).toLocaleTimeString()}` : "Checked in ✔",
  });
});

// ---------- gallery ----------
router.post("/gallery", upload.array("photos", 30), (req, res) => {
  const race = db.get("races", req.body.raceId);
  if (!race) {
    (req.files || []).forEach((f) => deleteUpload(`/uploads/${f.filename}`));
    return res.status(400).json({ message: "Choose which race these photos belong to." });
  }
  if (!req.files || !req.files.length) return res.status(400).json({ message: "Select at least one photo." });
  const caption = String(req.body.caption || "").trim();
  const photos = req.files.map((f) => db.insert("photos", { raceId: race.id, url: `/uploads/${f.filename}`, caption }));
  res.status(201).json({ photos });
});

router.patch("/gallery/:id", (req, res) => {
  const photo = db.update("photos", req.params.id, { caption: String(req.body.caption || "").trim() });
  if (!photo) return res.status(404).json({ message: "Photo not found." });
  res.json({ photo });
});

router.delete("/gallery/:id", (req, res) => {
  const photo = db.get("photos", req.params.id);
  if (!photo) return res.status(404).json({ message: "Photo not found." });
  deleteUpload(photo.url);
  deleteUpload(photo.thumb);
  db.remove("photos", photo.id);
  res.json({ ok: true });
});

module.exports = router;
