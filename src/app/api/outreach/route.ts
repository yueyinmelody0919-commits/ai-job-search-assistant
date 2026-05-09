/**
 * GET /api/outreach — Get all outreach activity (drafts, sent emails, follow-ups)
 * POST /api/outreach — Draft or send an outreach email with enriched recipient data
 */

import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, desc, sql } from "drizzle-orm";
import { draftEmail } from "@/lib/integrations/claude";
import { searchPeople } from "@/lib/integrations/apollo";
import { createDraft, sendEmail } from "@/lib/integrations/gmail";
import { logAgentAction } from "@/lib/memory/store";

export async function GET() {
  try {
    // Get all outreached/queued jobs with their details
    const outreachJobs = await db
      .select({
        pipeline: schema.pipeline,
        job: schema.jobs,
      })
      .from(schema.pipeline)
      .innerJoin(schema.jobs, eq(schema.pipeline.jobId, schema.jobs.id))
      .where(
        sql`${schema.pipeline.stage} IN ('queued', 'outreached', 'applied')`
      )
      .orderBy(desc(schema.pipeline.updatedAt));

    // Get contacts for these companies
    const companies = [...new Set(outreachJobs.map(j => j.job.company))];
    const contactsByCompany: Record<string, Array<{
      name: string; title: string; email: string | null;
    }>> = {};

    for (const company of companies) {
      const contacts = await db
        .select()
        .from(schema.contacts)
        .where(eq(schema.contacts.company, company))
        .limit(5);
      if (contacts.length > 0) {
        contactsByCompany[company] = contacts.map(c => ({
          name: c.name, title: c.title || "", email: c.email,
        }));
      }
    }

    // Get recent agent outreach logs
    const outreachLogs = await db
      .select()
      .from(schema.agentLogs)
      .where(
        sql`${schema.agentLogs.action} IN ('draft_email', 'send_email', 'slack_response') AND ${schema.agentLogs.agent} = 'strategist'`
      )
      .orderBy(desc(schema.agentLogs.createdAt))
      .limit(20);

    return NextResponse.json({
      outreach: outreachJobs,
      contacts: contactsByCompany,
      activity: outreachLogs,
    });
  } catch {
    return NextResponse.json({ outreach: [], contacts: {}, activity: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { jobId, recipientEmail, recipientName, action: emailAction } = await request.json();

    if (!jobId) {
      return NextResponse.json({ error: "jobId required" }, { status: 400 });
    }

    const job = await db.select().from(schema.jobs).where(eq(schema.jobs.id, jobId)).limit(1);
    if (!job[0]) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const j = job[0];

    // Enrich: find contacts at the company if we don't have them
    let contacts: Array<{ name: string; title: string; email: string | null }> = [];
    const existingContacts = await db
      .select()
      .from(schema.contacts)
      .where(eq(schema.contacts.company, j.company))
      .limit(5);

    if (existingContacts.length > 0) {
      contacts = existingContacts.map(c => ({ name: c.name, title: c.title || "", email: c.email }));
    } else {
      try {
        const apolloContacts = await searchPeople(j.company, { limit: 5 });
        for (const c of apolloContacts) {
          await db.insert(schema.contacts).values({
            name: c.name, company: c.company, title: c.title,
            email: c.email, linkedinUrl: c.linkedinUrl,
            source: "apollo", relationship: "cold",
          });
        }
        contacts = apolloContacts;
      } catch {
        // Apollo not configured, continue without enrichment
      }
    }

    // Get scores for context
    const scores = await db
      .select()
      .from(schema.jobScores)
      .where(eq(schema.jobScores.jobId, jobId));

    const scoreSummary = scores
      .map(s => `${s.dimension}: ${s.score}/5 — ${s.reason}`)
      .join("\n");

    // Draft the email
    const email = await draftEmail(
      j.title, j.company, j.description || "",
      scoreSummary, recipientName
    );

    // If sending, do it
    if (emailAction === "send" && recipientEmail) {
      const sent = await sendEmail(recipientEmail, email.subject, email.body);

      await db
        .update(schema.pipeline)
        .set({ stage: "outreached", updatedAt: new Date().toISOString() })
        .where(eq(schema.pipeline.jobId, jobId));

      await logAgentAction("strategist", "send_email", {
        jobId, company: j.company, to: recipientEmail,
      });

      return NextResponse.json({
        email, sent: true, threadId: sent.threadId, contacts,
      });
    }

    // Just draft
    if (recipientEmail) {
      const draft = await createDraft(recipientEmail, email.subject, email.body);
      await logAgentAction("strategist", "draft_email", {
        jobId, company: j.company, draftId: draft.id,
      });
      return NextResponse.json({ email, drafted: true, gmailDraft: draft, contacts });
    }

    await logAgentAction("strategist", "draft_email", { jobId, company: j.company });
    return NextResponse.json({ email, contacts });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Outreach failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
