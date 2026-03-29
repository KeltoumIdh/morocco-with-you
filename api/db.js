import path from "node:path";
import { fileURLToPath } from "node:url";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { seedData } from "./seed.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbFile = path.join(__dirname, "db.json");
const adapter = new JSONFile(dbFile);

export const db = new Low(adapter, seedData);

export async function initDb() {
  await db.read();
  if (!db.data) db.data = structuredClone(seedData);

  // Ensure collections exist (forward-compatible)
  db.data.trips ||= [];
  db.data.posts ||= [];
  db.data.bookings ||= [];
  db.data.users ||= [];
  db.data.commissions ||= [];
  db.data.aiLogs ||= [];
  db.data.itineraries ||= [];
  db.data.groupTrips ||= [];
  db.data.eventRequests ||= [];

  await db.write();
}

export function nowIso() {
  return new Date().toISOString();
}

export function nextId(prefix, existingIds) {
  // existingIds example: ["TR-001", "TR-099"]
  const nums = existingIds
    .map((id) => {
      const m = String(id).match(/(\d+)$/);
      return m ? Number(m[1]) : null;
    })
    .filter((n) => Number.isFinite(n));

  const next = (nums.length ? Math.max(...nums) : 0) + 1;

  // Keep the same look as your mock: TR-001, PO-001, etc.
  const pad = prefix === "AI" ? 3 : 3;
  return `${prefix}-${String(next).padStart(pad, "0")}`;
}

