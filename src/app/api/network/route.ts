/**
 * GET /api/network?company=Figma — Get contacts at a company via Apollo
 * POST /api/network — Enrich a company
 */

import { NextRequest, NextResponse } from "next/server";
import { searchPeople, enrichCompany, findWarmIntros } from "@/lib/integrations/apollo";
import { db, schema } from "@/lib/db";
import { eq, sql } from "drizzle-orm";
import { logAgentAction } from "@/lib/memory/store";

export async function GET(request: NextRequest) {
  const company = request.nextUrl.searchParams.get("company");

  if (!company) {
    // Return all saved contacts grouped by company
    try {
      const contacts = await db.select().from(schema.contacts).limit(100);
      const grouped: Record<string, typeof contacts> = {};
      for (const c of contacts) {
        const key = c.company || "Unknown";
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(c);
      }
      return NextResponse.json({ contacts: grouped });
    } catch {
      return NextResponse.json({ contacts: {} });
    }
  }

  try {
    // Check if we have cached contacts
    const cached = await db
      .select()
      .from(schema.contacts)
      .where(eq(schema.contacts.company, company));

    if (cached.length > 0) {
      return NextResponse.json({ company, contacts: cached, cached: true });
    }

    // Fetch from Apollo
    const contacts = await findWarmIntros(company);

    // Save to DB
    for (const contact of contacts) {
      await db.insert(schema.contacts).values({
        name: contact.name,
        company: contact.company,
        title: contact.title,
        email: contact.email,
        linkedinUrl: contact.linkedinUrl,
        source: "apollo",
        relationship: "cold",
      });
    }

    await logAgentAction("strategist", "network_lookup", {
      company,
      contactsFound: contacts.length,
    });

    return NextResponse.json({ company, contacts, cached: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network lookup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Batch population from high-scored jobs
    if (body.action === "batch_from_jobs") {
      const minScore = body.minScore || 80;
      const limit = body.limit || 10;

      // Get unique companies from jobs with high scores
      const topJobs = await db
        .select({ company: schema.jobs.company })
        .from(schema.jobs)
        .innerJoin(schema.jobScores, eq(schema.jobScores.jobId, schema.jobs.id))
        .where(sql`${schema.jobScores.overallScore} >= ${minScore} AND ${schema.jobScores.passNumber} = 2`)
        .groupBy(schema.jobs.company)
        .limit(limit);

      const results: Array<{ company: string; status: string; count?: number }> = [];

      for (const { company } of topJobs) {
        if (!company) continue;

        // Skip if contacts already exist
        const existing = await db
          .select({ count: sql<number>`count(*)` })
          .from(schema.contacts)
          .where(eq(schema.contacts.company, company));

        if ((existing[0]?.count ?? 0) > 0) {
          results.push({ company, status: "cached" });
          continue;
        }

        try {
          const contacts = await findWarmIntros(company);
          for (const contact of contacts) {
            await db.insert(schema.contacts).values({
              name: contact.name,
              company: contact.company || company,
              title: contact.title,
              email: contact.email,
              linkedinUrl: contact.linkedinUrl,
              source: "apollo",
              relationship: "cold",
            });
          }
          results.push({ company, status: "found", count: contacts.length });
        } catch {
          results.push({ company, status: "failed" });
        }
      }

      await logAgentAction("strategist", "batch_network_lookup", {
        companiesProcessed: results.length,
        contactsFound: results.filter((r) => r.status === "found").reduce((s, r) => s + (r.count || 0), 0),
      });

      return NextResponse.json({ action: "batch_from_jobs", results });
    }

    // Single company enrichment by domain
    const { domain } = body;
    if (!domain) {
      return NextResponse.json({ error: "domain or action required" }, { status: 400 });
    }

    const companyData = await enrichCompany(domain);
    if (!companyData) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    await logAgentAction("strategist", "company_enrich", {
      domain,
      company: companyData.name,
      employees: companyData.employeeCount,
    });

    return NextResponse.json({ company: companyData });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Enrichment failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
