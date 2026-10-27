// One-off import of the club's past race photo folders.
// Usage (with the backend stopped): node scripts/import-gallery.js <manifest.json>
// The manifest maps album keys to [{ url, thumb }] of files already in backend/uploads.
const fs = require("fs");
const db = require("../src/db");

const RACES = {
  "africa-day-2025": {
    title: "Africa Day Half Marathon 2025",
    date: "2025-05-31T06:00:00+02:00",
    location: "Harare, Zimbabwe",
    distances: [{ label: "21.1km", fee: 0 }],
    description:
      "Celebrating Africa Day on the road. Runners, partners and guests came together for the Africa Day Half Marathon, followed by the prize-giving and celebrations.",
  },
  "heroes-2025": {
    title: "Heroes Marathon 2025",
    date: "2025-08-10T06:00:00+02:00",
    location: "Harare, Zimbabwe",
    distances: [{ label: "42.2km", fee: 0 }, { label: "21.1km", fee: 0 }],
    description:
      "Honouring Zimbabwe's heroes with a sunrise start. The Mr Pace family turned out in red and white for the 2025 Heroes Marathon.",
  },
  "heroes-2024": {
    title: "Heroes Marathon 2024",
    date: "2024-08-10T06:00:00+02:00",
    location: "Museum of African Liberation, Harare",
    cover: 26,
    distances: [{ label: "42.2km", fee: 0 }, { label: "21.1km", fee: 0 }],
    description: "The 2024 Heroes Marathon and Half Marathon, starting and finishing at the Museum of African Liberation.",
  },
  "post-insurance": {
    title: "Post Insurance Half Marathon",
    date: "2025-09-27T06:00:00+02:00",
    location: "Harare, Zimbabwe",
    cover: 105,
    distances: [{ label: "21.1km", fee: 0 }],
    description:
      "The Post Insurance Half Marathon, presented with ZIMPOST and supported by Mr Pace. A huge field of runners, wheelchair athletes, warm-ups, medals and a full prize-giving.",
  },
};

const manifest = JSON.parse(fs.readFileSync(process.argv[2], "utf8").replace(/^﻿/, ""));

for (const [key, info] of Object.entries(RACES)) {
  if (!manifest[key]) continue;
  const photos = manifest[key];
  let race = db.find("races", (r) => r.title === info.title);
  if (!race) {
    race = db.insert("races", {
      ...info,
      date: new Date(info.date).toISOString(),
      capacity: 0,
      registrationOpen: false,
      resultsText: "",
      resultsUrl: "",
      coverImage: (photos.find((p) => p.url.endsWith(`-${String(info.cover || 0).padStart(4, "0")}.jpg`)) || photos[0] || {}).url || "",
      nextBib: 101,
    });
  }
  const existing = new Set(db.filter("photos", (p) => p.raceId === race.id).map((p) => p.url));
  const base = new Date(race.date).getTime();
  let added = 0;
  photos.forEach((p, i) => {
    if (existing.has(p.url)) return;
    // createdAt follows race order so the newest race's photos come first.
    db.insert("photos", { raceId: race.id, url: p.url, thumb: p.thumb, caption: "", createdAt: new Date(base + (photos.length - i) * 1000).toISOString() });
    added++;
  });
  console.log(`${info.title}: ${added} photos added (${photos.length} in folder)`);
}
