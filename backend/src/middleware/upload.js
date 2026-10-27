const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");

const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`);
  },
});

const imageOnly = (req, file, cb) => {
  if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
  else cb(new Error("Only JPG, PNG, WEBP or GIF images are allowed."));
};

const upload = multer({ storage, fileFilter: imageOnly, limits: { fileSize: 10 * 1024 * 1024 } });

function deleteUpload(url) {
  if (!url || !url.startsWith("/uploads/")) return;
  const file = path.join(UPLOAD_DIR, path.basename(url));
  fs.promises.unlink(file).catch(() => {});
}

module.exports = { upload, deleteUpload, UPLOAD_DIR };
