/**
 * POST /api/actions — Execute actions (draft email, send email, schedule follow-up, etc.)
 */

import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { draftEmail } from "@/lib/integrations/claude";
import { createDraft, sendEmail } from "@/lib/integrations/gmail";
import { addJobToTracker, updateJobStage } from "@/lib/integrations/sheets";
import {
  createFollowUpReminder,
  createInterviewPrepBlock,
} from "@/lib/integrations/calendar";
import { logAgentAction } from "@/lib/memory/store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, jobId, ...params } = body;

    const job = await db
      .select()
      .from(schema.jobs)
      .where(eq(schema.jobs.id, jobId))
      .limit(1);

    if (!job[0]) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const j = job[0];

    switch (action) {
      case "draft_email": {
        // Generate email via Claude
        const scores = await db
          .select()
          .from(schema.jobScores)
          .where(eq(schema.jobScores.jobId, jobId));

        const scoreSummary = scores
          .map((s) => `${s.dimension}: ${s.score}/5 — ${s.reason}`)
          .join("\n");

        const email = await draftEmail(
          j.title,
          j.company,
          j.description || "",
          scoreSummary,
          params.recipientName
        );

        // Create Gmail draft
        if (params.recipientEmail) {
          const draft = await createDraft(
            params.recipientEmail,
            email.subject,
            email.body
          );

          await logAgentAction("strategist", "draft_email", {
            jobId,
            company: j.company,
            draftId: draft.id,
          });

          return NextResponse.json({
            action: "draft_email",
            email,
            gmailDraft: draft,
          });
        }

        return NextResponse.json({ action: "draft_email", email });
      }

      case "send_email": {
        const { to, subject, body: emailBody } = params;
        if (!to || !subject || !emailBody) {
          return NextResponse.json(
            { error: "to, subject, and body required" },
            { status: 400 }
          );
        }

        const sent = await sendEmail(to, subject, emailBody);

        // Update pipeline stage
        await db
          .update(schema.pipeline)
          .set({ stage: "outreached", updatedAt: new Date().toISOString() })
          .where(eq(schema.pipeline.jobId, jobId));

        await logAgentAction("strategist", "send_email", {
          jobId,
          company: j.company,
          threadId: sent.threadId,
        });

        return NextResponse.json({
          action: "send_email",
          sent,
        });
      }

      case "add_to_tracker": {
        const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
        if (!spreadsheetId) {
          return NextResponse.json(
            { error: "GOOGLE_SHEETS_ID not configured" },
            { status: 500 }
          );
        }

        const score = await db
          .select()
          .from(schema.jobScores)
          .where(eq(schema.jobScores.jobId, jobId))
          .limit(1);

        await addJobToTracker(spreadsheetId, {
          id: j.id,
          title: j.title,
          company: j.company,
          location: j.location || "",
          score: score[0]?.overallScore || 0,
          stage: "discovered",
          source: j.source,
          url: j.url || "",
          notes: params.notes,
        });

        await logAgentAction("ops", "add_to_tracker", {
          jobId,
          company: j.company,
        });

        return NextResponse.json({ action: "add_to_tracker", success: true });
      }

      case "schedule_followup": {
        const followUpDate = params.date
          ? new Date(params.date)
          : new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // Default: 5 days

        const event = await createFollowUpReminder(
          j.company,
          j.title,
          followUpDate,
          params.notes
        );

        await logAgentAction("ops", "schedule_followup", {
          jobId,
          company: j.company,
          followUpDate: followUpDate.toISOString(),
        });

        return NextResponse.json({
          action: "schedule_followup",
          event,
        });
      }

      case "schedule_interview_prep": {
        const interviewDate = new Date(params.interviewDate);
        const event = await createInterviewPrepBlock(
          j.company,
          j.title,
          interviewDate,
          params.notes
        );

        await logAgentAction("ops", "schedule_interview_prep", {
          jobId,
          company: j.company,
          interviewDate: interviewDate.toISOString(),
        });

        return NextResponse.json({
          action: "schedule_interview_prep",
          event,
        });
      }

      case "test_email": {
        const to = params.to || "yueyin.melody0919@gmail.com";
        const subject = `Test Email — AI Colleague Team — ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })}`;
        const emailBody = `Hi Melody,\n\nThis is a test email from your AI Colleague Team dashboard.\n\nIf you're reading this, Gmail integration is working correctly.\n\nJob referenced: ${j.title} at ${j.company}\n\nBest,\nJim (Strategist Agent)`;

        const sent = await sendEmail(to, subject, emailBody);

        await logAgentAction("strategist", "test_email", {
          jobId, to, threadId: sent.threadId,
        });

        return NextResponse.json({ action: "test_email", sent, to });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Action failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
