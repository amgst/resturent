import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "../shared/schema.js";

// HTTP driver: one stateless request per query, which suits serverless
// (Vercel) and works the same on a normal server.
// `db` is only used when DATABASE_URL is set (see storage.ts); without it
// the app runs on the local JSON file instead.
export const db: NeonHttpDatabase<typeof schema> = process.env.DATABASE_URL
  ? drizzle(neon(process.env.DATABASE_URL), { schema })
  : (null as unknown as NeonHttpDatabase<typeof schema>);
