/**
 * Copies data/restaurant-data.json into the Postgres database.
 *
 * Usage (tables must exist first, via `npm run db:push`):
 *   npx cross-env DATABASE_URL="postgres://..." npm run db:import-json
 *
 * Safe to re-run: rows whose id already exists are skipped.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../shared/schema.js";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const db = drizzle(neon(process.env.DATABASE_URL), { schema });

const file = join(process.cwd(), "data", "restaurant-data.json");
const data = JSON.parse(readFileSync(file, "utf-8"), (_key, value) => {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
    return new Date(value);
  }
  return value;
});

// Parents before children, so foreign keys are satisfied.
const steps: Array<[string, any]> = [
  ["locations", schema.locations],
  ["menuCategories", schema.menuCategories],
  ["menuItems", schema.menuItems],
  ["areas", schema.areas],
  ["staff", schema.staff],
  ["tables", schema.tables],
  ["customers", schema.customers],
  ["orders", schema.orders],
  ["orderItems", schema.orderItems],
  ["payments", schema.payments],
  ["reservations", schema.reservations],
  ["restaurantSettings", schema.restaurantSettings],
];

async function main() {
  for (const [key, table] of steps) {
    const rows: any[] = data[key] ?? [];
    if (rows.length === 0) {
      console.log(`- ${key}: nothing to import`);
      continue;
    }
    for (let i = 0; i < rows.length; i += 100) {
      await db.insert(table).values(rows.slice(i, i + 100)).onConflictDoNothing();
    }
    console.log(`✓ ${key}: ${rows.length} rows`);
  }
  console.log("Done.");
}

main().catch((error) => {
  console.error("Import failed:", error);
  process.exit(1);
});
