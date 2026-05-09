/**
 * Seed the database with initial preferences and whitelist.
 * Usage: npx tsx scripts/seed-db.ts
 */

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../src/lib/db/schema";
import { DEFAULT_DIMENSIONS } from "../src/lib/scoring/thompson";

const client = createClient({ url: "file:./data/colleague-team.db" });
const db = drizzle(client, { schema });

async function main() {
  console.log("Seeding database...\n");

  // Seed preferences (Thompson Sampling priors)
  const existing = await db.select().from(schema.preferences);
  if (existing.length === 0) {
    for (const dim of DEFAULT_DIMENSIONS) {
      await db.insert(schema.preferences).values({
        dimension: dim.dimension,
        alpha: 2,
        beta_param: 2,
        effectiveWeight: dim.baseWeight,
      });
    }
    console.log(`  ✓ Seeded ${DEFAULT_DIMENSIONS.length} scoring dimensions`);
  } else {
    console.log(`  — Preferences already seeded (${existing.length} dimensions)`);
  }

  // Seed whitelist with Melody's email
  const existingWhitelist = await db.select().from(schema.whitelist);
  if (existingWhitelist.length === 0) {
    await db.insert(schema.whitelist).values({
      email: "yueyin.melody0919@gmail.com",
      approvedBy: "system",
    });
    console.log("  ✓ Added yueyin.melody0919@gmail.com to whitelist");
  } else {
    console.log(`  — Whitelist already has ${existingWhitelist.length} entries`);
  }

  console.log("\nDone.");
}

main().catch(console.error);
