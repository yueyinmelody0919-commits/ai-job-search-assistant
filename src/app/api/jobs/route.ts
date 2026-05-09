/**
 * GET /api/jobs — List all discovered jobs with scores
 * POST /api/jobs/scan — Trigger a new job scan
 */

import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { desc, eq, sql } from "drizzle-orm";
import { searchJobs, DEFAULT_SEARCH_QUERIES, DEFAULT_LOCATIONS } from "@/lib/integrations/jsearch";
import { searchAdzunaJobs } from "@/lib/integrations/adzuna";
import { hardFilter } from "@/lib/scoring/rubric";
import { logAgentAction } from "@/lib/memory/store";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const stage = searchParams.get("stage");
  const minScore = searchParams.get("minScore");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  try {
    // Get jobs with their latest scores and pipeline stage
    const jobsWithScores = await db
      .select({
        job: schema.jobs,
        overallScore: sql<number>`(
          SELECT overall_score FROM job_scores
          WHERE job_id = ${schema.jobs.id} AND pass_number = 2
          ORDER BY created_at DESC LIMIT 1
        )`,
        stage: sql<string>`(
          SELECT stage FROM pipeline
          WHERE job_id = ${schema.jobs.id}
          ORDER BY updated_at DESC LIMIT 1
        )`,
      })
      .from(schema.jobs)
      .orderBy(desc(schema.jobs.discoveredAt))
      .limit(limit)
      .offset(offset);

    let results = jobsWithScores;

    if (stage) {
      results = results.filter((r) => r.stage === stage);
    }
    if (minScore) {
      results = results.filter(
        (r) => (r.overallScore ?? 0) >= parseInt(minScore)
      );
    }

    return NextResponse.json({
      jobs: results,
      total: results.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "scan") {
      const newJobs: Array<{ id: number; title: string; company: string }> = [];
      const queries = body.queries || DEFAULT_SEARCH_QUERIES;
      const locations = body.locations || DEFAULT_LOCATIONS;

      for (const query of queries.slice(0, 3)) {
        for (const location of locations) {
          try {
            // JSearch
            const jsearchJobs = await searchJobs({
              query,
              location,
              datePosted: "week",
            });

            for (const job of jsearchJobs) {
              // Check if already exists
              const existing = await db
                .select()
                .from(schema.jobs)
                .where(eq(schema.jobs.externalId, job.externalId || ""))
                .limit(1);

              if (existing.length > 0) continue;

              // Apply hard filter
              const filterResult = hardFilter(job as typeof schema.jobs.$inferSelect);
              if (!filterResult.passed) continue;

              // Insert
              const result = await db.insert(schema.jobs).values(job);
              const jobId = Number(result.lastInsertRowid);

              // Add to pipeline as discovered
              await db.insert(schema.pipeline).values({
                jobId,
                stage: "discovered",
              });

              newJobs.push({
                id: jobId,
                title: job.title,
                company: job.company,
              });
            }
          } catch {
            // Continue on individual query failures
          }

          try {
            // Adzuna
            const adzunaJobs = await searchAdzunaJobs({
              query,
              location,
              maxDaysOld: 7,
            });

            for (const job of adzunaJobs) {
              const existing = await db
                .select()
                .from(schema.jobs)
                .where(eq(schema.jobs.externalId, job.externalId || ""))
                .limit(1);

              if (existing.length > 0) continue;

              const filterResult = hardFilter(job as typeof schema.jobs.$inferSelect);
              if (!filterResult.passed) continue;

              const result = await db.insert(schema.jobs).values(job);
              const jobId = Number(result.lastInsertRowid);

              await db.insert(schema.pipeline).values({
                jobId,
                stage: "discovered",
              });

              newJobs.push({
                id: jobId,
                title: job.title,
                company: job.company,
              });
            }
          } catch {
            // Continue on individual query failures
          }
        }
      }

      await logAgentAction("scout", "job_scan", {
        queriesUsed: queries.length,
        locationsUsed: locations.length,
        newJobsFound: newJobs.length,
      });

      return NextResponse.json({
        scanned: true,
        newJobs,
        count: newJobs.length,
      });
    }

    return NextResponse.json(
      { error: "Unknown action" },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Scan failed" },
      { status: 500 }
    );
  }
}
