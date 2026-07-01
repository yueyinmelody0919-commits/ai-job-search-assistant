/**
 * Seed the database with initial preferences and whitelist.
 * Usage: npx tsx scripts/seed-db.ts
 */

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../src/lib/db/schema";
import { DEFAULT_DIMENSIONS } from "../src/lib/scoring/thompson";

const client = createClient({ url: process.env.DATABASE_URL || "file:./data/job-search.db" });
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

  // Seed whitelist with the owner's email (set OWNER_EMAIL in .env to your own).
  const ownerEmail = process.env.OWNER_EMAIL || "you@example.com";
  const existingWhitelist = await db.select().from(schema.whitelist);
  if (existingWhitelist.length === 0) {
    await db.insert(schema.whitelist).values({
      email: ownerEmail,
      approvedBy: "system",
    });
    console.log(`  ✓ Added ${ownerEmail} to whitelist`);
  } else {
    console.log(`  — Whitelist already has ${existingWhitelist.length} entries`);
  }

  // Seed agent configs (all capabilities enabled by default)
  const AGENT_CAPABILITIES: Record<string, string[]> = {
    scout: ["Search JSearch API", "Search Adzuna API", "Discover jobs", "Research companies via Tavily"],
    analyst: ["Score jobs via Claude API", "Update Thompson Sampling weights", "Process feedback"],
    strategist: ["Draft emails via Claude API", "Send emails via Gmail API", "Look up contacts via Apollo"],
    ops: ["Manage pipeline stages", "Create Google Calendar events", "Update Google Sheets tracker"],
    engineer: ["Manage whitelist", "Suggest features", "Monitor agent performance"],
    coach: ["Recommend learning resources", "Identify skill gaps", "Search courses via Tavily"],
    qa: ["Investigate bugs", "Monitor test results", "Track error logs"],
  };

  const existingConfigs = await db.select().from(schema.agentConfigs);
  if (existingConfigs.length === 0) {
    let count = 0;
    for (const [agent, capabilities] of Object.entries(AGENT_CAPABILITIES)) {
      for (const capability of capabilities) {
        await db.insert(schema.agentConfigs).values({ agent, capability, enabled: true });
        count++;
      }
    }
    console.log(`  ✓ Seeded ${count} agent config entries`);
  } else {
    console.log(`  — Agent configs already seeded (${existingConfigs.length} entries)`);
  }

  console.log("\nDone.");
}

main().catch(console.error);
