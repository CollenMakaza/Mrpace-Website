const jwt = require("jsonwebtoken");
const db = require("../db");

const SECRET = () => process.env.JWT_SECRET || "dev-secret-change-me";

function sign(payload) {
  return jwt.sign(payload, SECRET(), { expiresIn: "7d" });
}

function readToken(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return null;
  try {
    return jwt.verify(header.slice(7), SECRET());
  } catch {
    return null;
  }
}

function requireUser(req, res, next) {
  const payload = readToken(req);
  const user = payload && payload.role === "user" && db.get("users", payload.id);
  if (!user) return res.status(401).json({ message: "Please log in to continue." });
  req.user = user;
  next();
}

function requireAdmin(req, res, next) {
  const payload = readToken(req);
  const admin = payload && payload.role === "admin" && db.get("admins", payload.id);
  if (!admin) return res.status(401).json({ message: "Admin login required." });
  req.admin = admin;
  next();
}

module.exports = { sign, requireUser, requireAdmin };
