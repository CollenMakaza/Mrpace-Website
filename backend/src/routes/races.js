const router = require("express").Router();
const db = require("../db");

function serializeRace(race) {
  const taken = db.filter("registrations", (r) => r.raceId === race.id && r.status !== "rejected").length;
  const photoCount = db.filter("photos", (p) => p.raceId === race.id).length;
  const isPast = new Date(race.date) < new Date();
  return {
    ...race,
    spotsTaken: taken,
    spotsLeft: race.capacity ? Math.max(0, race.capacity - taken) : null,
    photoCount,
    isPast,
    canRegister: !isPast && race.registrationOpen !== false && (!race.capacity || taken < race.capacity),
  };
}

// GET /api/races?when=upcoming|recent|all
router.get("/", (req, res) => {
  const when = req.query.when || "all";
  const nowTime = Date.now();
  let races = db.all("races").slice();
  if (when === "upcoming") races = races.filter((r) => new Date(r.date).getTime() >= nowTime);
  if (when === "recent") races = races.filter((r) => new Date(r.date).getTime() < nowTime);
  races.sort((a, b) =>
    when === "recent" ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date)
  );
  const limit = Number(req.query.limit) || 0;
  if (limit) races = races.slice(0, limit);
  res.json({ races: races.map(serializeRace) });
});

router.get("/:id", (req, res) => {
  const race = db.get("races", req.params.id);
  if (!race) return res.status(404).json({ message: "Race not found." });
  const photos = db
    .filter("photos", (p) => p.raceId === race.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ race: serializeRace(race), photos });
});

module.exports = router;
module.exports.serializeRace = serializeRace;
