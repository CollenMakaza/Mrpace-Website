const router = require("express").Router();
const db = require("../db");

// GET /api/gallery?raceId=...  -> photos plus the races that have photos
router.get("/", (req, res) => {
  let photos = db.all("photos").slice();
  if (req.query.raceId) photos = photos.filter((p) => p.raceId === req.query.raceId);
  photos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const limit = Number(req.query.limit) || 0;
  if (limit) photos = photos.slice(0, limit);

  const raceIds = new Set(db.all("photos").map((p) => p.raceId));
  const albums = db
    .filter("races", (r) => raceIds.has(r.id))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map((r) => ({
      id: r.id,
      title: r.title,
      date: r.date,
      count: db.filter("photos", (p) => p.raceId === r.id).length,
      cover: r.coverImage || db.find("photos", (p) => p.raceId === r.id)?.url || null,
    }));

  const raceTitles = Object.fromEntries(db.all("races").map((r) => [r.id, r.title]));
  res.json({ photos: photos.map((p) => ({ ...p, raceTitle: raceTitles[p.raceId] || "" })), albums });
});

module.exports = router;
