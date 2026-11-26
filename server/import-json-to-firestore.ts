/**
 * Copies data/restaurant-data.json into Firestore.
 *
 * Usage (Firebase credentials in .env, see .env.example):
 *   npm run db:import-json
 *
 * Keeps the existing ids, so links between records (orders → items, etc.) stay intact.
 * Safe to re-run: documents with the same id are overwritten with the file's version.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { getDb, hasFirebaseCredentials } from "./firebase-admin.js";

if (!hasFirebaseCredentials()) {
  console.error("Firebase credentials are not set. Add FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS to .env.");
  process.exit(1);
}

const file = join(process.cwd(), "data", "restaurant-data.json");
let data: Record<string, Array<Record<string, unknown>>>;
try {
  data = JSON.parse(readFileSync(file, "utf-8"), (_key, value) => {
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
      return new Date(value);
    }
    return value;
  });
} catch (error) {
  console.error(`Couldn't read ${file}. Is it valid JSON?`, error instanceof Error ? error.message : error);
  process.exit(1);
}

// JSON key → Firestore collection (same names as server/firestore-storage.ts).
const collections = [
  "locations",
  "menuCategories",
  "menuItems",
  "areas",
  "staff",
  "tables",
  "customers",
  "orders",
  "orderItems",
  "payments",
  "reservations",
  "restaurantSettings",
];

async function main() {
  const db = getDb();
  for (const name of collections) {
    const rows = data[name] ?? [];
    if (rows.length === 0) {
      console.log(`- ${name}: nothing to import`);
      continue;
    }
    for (let i = 0; i < rows.length; i += 400) {
      const batch = db.batch();
      for (const row of rows.slice(i, i + 400)) {
        const { id, ...fields } = row;
        const ref = id ? db.collection(name).doc(String(id)) : db.collection(name).doc();
        batch.set(ref, fields);
      }
      await batch.commit();
    }
    console.log(`✓ ${name}: ${rows.length}`);
  }
  console.log("Done.");
}

main().catch((error) => {
  console.error("Import failed:", error);
  process.exit(1);
});
