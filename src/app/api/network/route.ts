/**
 * GET /api/network?company=Figma — Get contacts at a company via Apollo
 * POST /api/network — Enrich a company
 */

import { NextRequest, NextResponse } from "next/server";
import { searchPeople, enrichCompany, findWarmIntros } from "@/lib/integrations/apollo";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
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
    const { domain } = await request.json();
    if (!domain) {
      return NextResponse.json({ error: "domain required" }, { status: 400 });
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
