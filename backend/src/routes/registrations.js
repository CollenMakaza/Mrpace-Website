const router = require("express").Router();
const db = require("../db");
const { requireUser } = require("../middleware/auth");
const paynow = require("../utils/paynow");
const { serializeRace } = require("./races");

const PHONE_RE = /^(\+?263|0)7[1378]\d{7}$/;

function withRace(reg) {
  const race = db.get("races", reg.raceId);
  const { paynowPollUrl, ...payment } = reg.payment || {};
  return { ...reg, payment, race: race ? serializeRace(race) : null };
}

function ownRegistration(req, res) {
  const reg = db.get("registrations", req.params.id);
  if (!reg || reg.userId !== req.user.id) {
    res.status(404).json({ message: "Registration not found." });
    return null;
  }
  return reg;
}

// Marks a registration as paid via Paynow (still needs admin verification).
async function refreshPaynow(reg) {
  if (!reg.payment || !reg.payment.paynowPollUrl || reg.payment.paid) return reg;
  try {
    const result = await paynow.checkPayment(reg.payment.paynowPollUrl);
    const payment = { ...reg.payment, paynowStatus: result.status };
    if (result.paid) {
      payment.paid = true;
      payment.paidAt = new Date().toISOString();
      if (result.paynowReference) payment.reference = String(result.paynowReference);
    }
    return db.update("registrations", reg.id, {
      payment,
      ...(result.paid && reg.status === "awaiting_payment" ? { status: "pending_verification" } : {}),
    });
  } catch (err) {
    console.error("[paynow] poll failed:", err.message);
    return reg;
  }
}

router.get("/mine", requireUser, (req, res) => {
  const regs = db
    .filter("registrations", (r) => r.userId === req.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ registrations: regs.map(withRace) });
});

router.post("/", requireUser, (req, res) => {
  const race = db.get("races", req.body.raceId);
  if (!race) return res.status(404).json({ message: "Race not found." });
  const info = serializeRace(race);
  if (!info.canRegister) return res.status(400).json({ message: "Registration for this race is closed." });

  const distance = (race.distances || []).find((d) => d.label === req.body.distance);
  if (!distance) return res.status(400).json({ message: "Please choose a race distance." });

  const existing = db.find(
    "registrations",
    (r) => r.userId === req.user.id && r.raceId === race.id && r.status !== "rejected"
  );
  if (existing) {
    return res.status(409).json({ message: "You are already registered for this race.", registration: withRace(existing) });
  }

  const fee = Number(distance.fee) || 0;
  const reg = db.insert("registrations", {
    userId: req.user.id,
    raceId: race.id,
    distance: distance.label,
    fee,
    tshirtSize: req.body.tshirtSize || "",
    emergencyName: String(req.body.emergencyName || "").trim(),
    emergencyPhone: String(req.body.emergencyPhone || "").trim(),
    status: fee > 0 ? "awaiting_payment" : "pending_verification",
    payment: fee > 0 ? null : { method: "free", paid: true },
  });
  res.status(201).json({ registration: withRace(reg) });
});

// POST /api/registrations/:id/pay  { method: ecocash|onemoney|web|manual, phone?, reference? }
router.post("/:id/pay", requireUser, async (req, res) => {
  const reg = ownRegistration(req, res);
  if (!reg) return;
  if (!["awaiting_payment", "rejected"].includes(reg.status)) {
    return res.status(400).json({ message: "This registration is already paid." });
  }
  const race = db.get("races", reg.raceId);
  const method = req.body.method;

  if (method === "manual") {
    const reference = String(req.body.reference || "").trim();
    if (reference.length < 4) return res.status(400).json({ message: "Please enter the transaction reference from your payment SMS/receipt." });
    const updated = db.update("registrations", reg.id, {
      status: "pending_verification",
      adminNote: "",
      payment: {
        method: "manual",
        channel: req.body.channel || "EcoCash",
        reference,
        payerPhone: String(req.body.phone || "").trim(),
        paid: false,
        submittedAt: new Date().toISOString(),
      },
    });
    return res.json({ registration: withRace(updated), message: "Payment submitted. An admin will verify it shortly." });
  }

  if (!["ecocash", "onemoney", "web"].includes(method)) {
    return res.status(400).json({ message: "Choose a payment method." });
  }
  if (!paynow.enabled()) return res.status(400).json({ message: "Online payments are not available right now. Please use manual payment." });

  const phone = String(req.body.phone || "").replace(/\s+/g, "");
  if (method !== "web" && !PHONE_RE.test(phone)) {
    return res.status(400).json({ message: "Enter a valid Zimbabwean mobile number, e.g. 0771234567." });
  }

  try {
    const reference = `MP-${reg.id.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    const result = await paynow.startPayment({
      reference,
      email: req.user.email,
      description: `${race.title} - ${reg.distance}`,
      amount: reg.fee,
      method,
      phone,
    });
    const updated = db.update("registrations", reg.id, {
      status: "awaiting_payment",
      adminNote: "",
      payment: {
        method,
        payerPhone: phone,
        merchantReference: reference,
        paynowPollUrl: result.pollUrl,
        paid: false,
        submittedAt: new Date().toISOString(),
      },
    });
    res.json({ registration: withRace(updated), redirectUrl: result.redirectUrl, instructions: result.instructions });
  } catch (err) {
    res.status(502).json({ message: err.message });
  }
});

router.get("/:id/payment-status", requireUser, async (req, res) => {
  const reg = ownRegistration(req, res);
  if (!reg) return;
  const updated = await refreshPaynow(reg);
  res.json({ registration: withRace(updated) });
});

router.delete("/:id", requireUser, (req, res) => {
  const reg = ownRegistration(req, res);
  if (!reg) return;
  if (reg.status === "approved") return res.status(400).json({ message: "Approved registrations can't be cancelled online. Contact the club." });
  db.remove("registrations", reg.id);
  res.json({ ok: true });
});

module.exports = router;
module.exports.refreshPaynow = refreshPaynow;
module.exports.withRace = withRace;
