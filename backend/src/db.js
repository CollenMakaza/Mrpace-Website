// Tiny JSON-file database. Good enough for a club-sized site and needs no
// database server. Data lives in backend/data/db.json.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_DIR = path.join(__dirname, "..", "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

const empty = { users: [], admins: [], races: [], registrations: [], photos: [] };

let state;

function load() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    state = structuredClone(empty);
    save();
  } else {
    state = { ...structuredClone(empty), ...JSON.parse(fs.readFileSync(DB_FILE, "utf8")) };
  }
}

function save() {
  const tmp = DB_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();

const db = {
  all: (table) => state[table],
  find: (table, fn) => state[table].find(fn),
  filter: (table, fn) => state[table].filter(fn),
  get: (table, recordId) => state[table].find((r) => r.id === recordId),
  insert(table, data) {
    const record = { id: id(), createdAt: now(), ...data };
    state[table].push(record);
    save();
    return record;
  },
  update(table, recordId, changes) {
    const record = state[table].find((r) => r.id === recordId);
    if (!record) return null;
    Object.assign(record, changes, { updatedAt: now() });
    save();
    return record;
  },
  remove(table, recordId) {
    const before = state[table].length;
    state[table] = state[table].filter((r) => r.id !== recordId);
    save();
    return state[table].length !== before;
  },
  removeWhere(table, fn) {
    state[table] = state[table].filter((r) => !fn(r));
    save();
  },
};

load();

module.exports = db;
