require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const db = require("./db");
const { UPLOAD_DIR } = require("./middleware/upload");

const app = express();
const PORT = process.env.PORT || 5000;

const allowed = [process.env.CLIENT_URL, process.env.ADMIN_URL]
  .filter(Boolean)
  .flatMap((s) => s.split(","))
  .map((s) => s.trim());

app.use(
  cors({
    origin: (origin, cb) => cb(null, !origin || allowed.length === 0 || allowed.includes(origin)),
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(UPLOAD_DIR, { maxAge: "7d" }));

app.get("/api/health", (req, res) => res.json({ ok: true, club: "Mr Pace Athletics Club" }));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/races", require("./routes/races"));
app.use("/api/gallery", require("./routes/gallery"));
app.use("/api/registrations", require("./routes/registrations"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/admin", require("./routes/admin"));

app.use("/api", (req, res) => res.status(404).json({ message: "Not found." }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || /images are allowed/.test(err.message)) {
    return res.status(400).json({ message: err.code === "LIMIT_FILE_SIZE" ? "Each image must be under 10MB." : err.message });
  }
  console.error(err);
  res.status(500).json({ message: "Something went wrong on the server." });
});

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;
  if (!db.find("admins", (a) => a.email === email)) {
    db.insert("admins", { email, name: process.env.ADMIN_NAME || "Admin", passwordHash: await bcrypt.hash(password, 10) });
    console.log(`[setup] Admin account created for ${email}`);
  }
}

seedAdmin().then(() => {
  app.listen(PORT, () => console.log(`Mr Pace API running on http://localhost:${PORT}`));
});
