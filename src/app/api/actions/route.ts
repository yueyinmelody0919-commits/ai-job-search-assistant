/**
 * POST /api/actions — Execute actions (draft email, send email, schedule follow-up, etc.)
 */

import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { draftEmail } from "@/lib/integrations/claude";
import { createDraft, sendEmail, sendEmailWithAttachment } from "@/lib/integrations/gmail";
import { searchPeople } from "@/lib/integrations/apollo";
import * as fs from "fs";
import * as path from "path";
import { addJobToTracker, updateJobStage } from "@/lib/integrations/sheets";
import {
  createFollowUpReminder,
  createInterviewPrepBlock,
} from "@/lib/integrations/calendar";
import { logAgentAction } from "@/lib/memory/store";

// Sender identity + resume are configurable via .env so anyone can run this
// against their own job search. Defaults are placeholders — override them.
const SENDER_NAME = process.env.SENDER_NAME || "Your Name";
const SENDER_CONTACT = process.env.SENDER_CONTACT || "you@example.com | Your City";
const SENDER_LINKEDIN = process.env.SENDER_LINKEDIN || "linkedin.com/in/your-handle";
const SENDER_BIO =
  process.env.SENDER_BIO ||
  "A bit about me: I lead GTM Strategy & Operations, where I own the revenue operations stack end to end — from pipeline analytics to pricing to cross-functional planning. Before that I spent several years in management consulting advising on go-to-market transformation and operational scaling.";
const OWNER_EMAIL = process.env.OWNER_EMAIL || "you@example.com";
const RESUME_PATH =
  process.env.RESUME_PATH || path.resolve(process.cwd(), "data/resume.pdf");
const RESUME_FILENAME = process.env.RESUME_FILENAME || "resume.pdf";

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
          .map((s) => `${s.dimension}: ${s.score}/5 - ${s.reason}`)
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
        const { subject, body: emailBody } = params;
        const to = params.to || OWNER_EMAIL;
        if (!subject || !emailBody) {
          return NextResponse.json(
            { error: "subject and body required" },
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

      case "draft_networking": {
        // Research hiring manager / recruiter
        let recipientName = params.recipientName || "";
        let recipientEmail = params.to || "";
        let recipientTitle = "";

        if (!recipientName || !recipientEmail) {
          // Try Apollo first (requires paid plan)
          try {
            const contacts = await searchPeople(j.company, {
              titles: ["Recruiter", "Talent", "People", "HR", "Hiring", "Head of People", "VP People", "VP Talent", "Director Talent", "Head of Recruiting"],
              limit: 5,
            });
            const bestContact = contacts.find((c) => c.email) || contacts[0];
            if (bestContact) {
              recipientName = bestContact.name;
              recipientEmail = bestContact.email || "";
              recipientTitle = bestContact.title;
            }
          } catch {
            // Apollo failed (likely free plan), try Claude to extract from job description
          }

          // If Apollo didn't find anyone, use Claude to research
          if (!recipientEmail) {
            try {
              const { chat } = await import("@/lib/integrations/claude");
              const contactPrompt = `Given this job posting at ${j.company} for the role "${j.title}", who is most likely the hiring manager or recruiter?

Job description excerpt: ${(j.description || "").slice(0, 500)}

Respond in ONLY this JSON format (no other text):
{"name": "First Last", "email": "email@company.com", "title": "Their Title"}

If you cannot determine the exact person, use the company's general recruiting email format (e.g., recruiting@company.com or careers@company.com). For the name, use "Recruiting Team" if unknown.`;

              const result = await chat(
                "You are a recruiter research assistant. Return only valid JSON.",
                [{ role: "user", content: contactPrompt }],
                { temperature: 0.3, maxTokens: 200 }
              );

              const parsed = JSON.parse(result.trim());
              if (parsed.name) recipientName = parsed.name;
              if (parsed.email) recipientEmail = parsed.email;
              if (parsed.title) recipientTitle = parsed.title;
            } catch {
              // Claude lookup failed too
            }
          }
        }

        if (!recipientName) recipientName = "Hiring Manager";

        // Determine greeting based on whether it's a generic address or a person
        const isGenericEmail = recipientEmail.match(/^(careers|recruiting|jobs|talent|hr|apply|info)@/i);
        const greeting = isGenericEmail
          ? "Dear Recruiting Team"
          : `Hi ${recipientName.split(" ")[0]}`;

        const draftSubject = `${j.title} - ${SENDER_NAME}`;

        const draftBody = `${greeting},

I hope this message finds you well. I came across the ${j.title} role at ${j.company} and was immediately drawn to it. The combination of ${j.company}'s growth trajectory and the scope of this position aligns closely with what I'm looking for in my next chapter.

${SENDER_BIO}

What excites me most about this opportunity:
- The chance to build and scale operations at a company in a high-growth phase
- The strategic scope. I thrive at the intersection of data, GTM execution, and executive decision-making
- ${j.company}'s position in the market and the potential to make a meaningful impact

I've attached my resume for your reference. I'd love the chance to connect briefly, even 15 minutes would be great to learn more about the team's priorities and share how my experience might be a fit.

Would you be open to a quick conversation this week or next?

Best regards,
${SENDER_NAME}
${SENDER_CONTACT}
${SENDER_LINKEDIN}`;

        // Create draft with resume attachment
        const resumePath = RESUME_PATH;
        let draft;
        try {
          const resumeBuffer = fs.readFileSync(resumePath);
          // Build raw MIME email with attachment for draft
          const boundary = "draft_boundary_" + Date.now().toString(36);
          const attachmentBase64 = resumeBuffer.toString("base64");
          const rawEmail = [
            `To: ${recipientEmail}`,
            `Subject: ${draftSubject}`,
            `MIME-Version: 1.0`,
            `Content-Type: multipart/mixed; boundary="${boundary}"`,
            "",
            `--${boundary}`,
            "Content-Type: text/plain; charset=utf-8",
            "",
            draftBody,
            "",
            `--${boundary}`,
            `Content-Type: application/pdf; name="${RESUME_FILENAME}"`,
            `Content-Disposition: attachment; filename="${RESUME_FILENAME}"`,
            "Content-Transfer-Encoding: base64",
            "",
            attachmentBase64,
            "",
            `--${boundary}--`,
          ].join("\r\n");

          const token = await (await import("@/lib/integrations/gmail")).getAccessToken();
          const rawMessage = Buffer.from(rawEmail).toString("base64url");
          const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/drafts", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ message: { raw: rawMessage } }),
          });
          const data = await response.json();
          draft = { id: data.id, threadId: data.message?.threadId };
        } catch {
          // Fallback: plain text draft without attachment
          draft = await createDraft(recipientEmail, draftSubject, draftBody);
        }

        await logAgentAction("strategist", "draft_networking", {
          jobId, company: j.company, draftId: draft.id,
          recipientName, recipientEmail, recipientTitle,
        });

        return NextResponse.json({
          action: "draft_networking",
          draft,
          subject: draftSubject,
          company: j.company,
          recipient: { name: recipientName, email: recipientEmail, title: recipientTitle },
        });
      }

      case "networking_email": {
        const to = params.to || OWNER_EMAIL;
        const recipientName = params.recipientName || "Hiring Manager";
        const recipientTitle = params.recipientTitle || "";

        const subject = `${j.title} - ${SENDER_NAME}`;

        const body = `Hi ${recipientName},

I hope this message finds you well. I came across the ${j.title} role at ${j.company} and was immediately drawn to it. The combination of ${j.company}'s growth trajectory and the scope of this position aligns closely with what I'm looking for in my next chapter.

${SENDER_BIO}

What excites me most about this opportunity:
• The chance to build and scale operations at a company in a high-growth phase
• The strategic scope. I thrive at the intersection of data, GTM execution, and executive decision-making
• ${j.company}'s position in the market and the potential to make a meaningful impact

I've attached my resume for your reference. I'd love the chance to connect briefly, even 15 minutes would be great to learn more about the team's priorities and share how my experience might be a fit.

Would you be open to a quick conversation this week or next?

Best regards,
${SENDER_NAME}
${SENDER_CONTACT}
${SENDER_LINKEDIN}`;

        // Attach resume
        const resumePath = RESUME_PATH;
        let sent;

        try {
          const resumeBuffer = fs.readFileSync(resumePath);
          sent = await sendEmailWithAttachment(to, subject, body, {
            filename: RESUME_FILENAME,
            content: resumeBuffer,
            mimeType: "application/pdf",
          });
        } catch (attachErr) {
          // Fallback: send without attachment if file not found
          sent = await sendEmail(to, subject, body + "\n\n[Resume attachment unavailable - please request separately]");
        }

        await logAgentAction("strategist", "networking_email", {
          jobId, to, company: j.company, threadId: sent.threadId,
        });

        return NextResponse.json({ action: "networking_email", sent, to, subject });
      }

      case "test_email": {
        const to = params.to || OWNER_EMAIL;
        const subject = `Test Email - Job Search OS - ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })}`;
        const emailBody = `Hi there,\n\nThis is a test email from your Job Search OS dashboard.\n\nIf you're reading this, Gmail integration is working correctly.\n\nJob referenced: ${j.title} at ${j.company}\n\nBest,\nJim (Strategist Agent)`;

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
