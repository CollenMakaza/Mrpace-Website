const router = require("express").Router();
const bcrypt = require("bcryptjs");
const db = require("../db");
const { sign, requireUser } = require("../middleware/auth");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const publicUser = ({ passwordHash, ...u }) => u;

router.post("/signup", async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const phone = String(req.body.phone || "").trim();
  const password = String(req.body.password || "");

  if (!name) return res.status(400).json({ message: "Please enter your full name." });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ message: "Please enter a valid email address." });
  if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters." });
  if (db.find("users", (u) => u.email === email)) {
    return res.status(409).json({ message: "An account with this email already exists. Try logging in." });
  }

  const user = db.insert("users", {
    name,
    email,
    phone,
    gender: req.body.gender || "",
    dateOfBirth: req.body.dateOfBirth || "",
    passwordHash: await bcrypt.hash(password, 10),
  });
  res.status(201).json({ token: sign({ id: user.id, role: "user" }), user: publicUser(user) });
});

router.post("/login", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const user = db.find("users", (u) => u.email === email);
  if (!user || !(await bcrypt.compare(String(req.body.password || ""), user.passwordHash))) {
    return res.status(401).json({ message: "Wrong email or password." });
  }
  res.json({ token: sign({ id: user.id, role: "user" }), user: publicUser(user) });
});

router.get("/me", requireUser, (req, res) => res.json({ user: publicUser(req.user) }));

router.put("/me", requireUser, (req, res) => {
  const { name, phone, gender, dateOfBirth } = req.body;
  const user = db.update("users", req.user.id, {
    ...(name ? { name: String(name).trim() } : {}),
    ...(phone !== undefined ? { phone: String(phone).trim() } : {}),
    ...(gender !== undefined ? { gender } : {}),
    ...(dateOfBirth !== undefined ? { dateOfBirth } : {}),
  });
  res.json({ user: publicUser(user) });
});

module.exports = router;
