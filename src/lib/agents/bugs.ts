/**
 * Bug reporting system for AI agents.
 *
 * When an agent encounters an error or limitation, it files a bug report
 * with a Claude-focused fix prompt that can be copy-pasted to resolve the issue.
 */

import { db, schema } from "../db";
import { eq, desc } from "drizzle-orm";
import type { BugReport } from "../db/schema";

interface BugReportInput {
  title: string;
  description: string;
  reportedBy: string;
  severity?: "low" | "medium" | "high" | "critical";
  errorMessage?: string;
  stackTrace?: string;
  context?: Record<string, unknown>;
}

/**
 * Generate a clean, actionable Claude prompt for fixing a bug.
 */
function generateFixPrompt(input: BugReportInput): string {
  const parts = [
    `Fix the following bug in the Leena Job Search Assistant project.`,
    ``,
    `## Bug: ${input.title}`,
    ``,
    `**Description:** ${input.description}`,
    `**Reported by:** ${input.reportedBy} agent`,
    `**Severity:** ${input.severity || "medium"}`,
  ];

  if (input.errorMessage) {
    parts.push(``, `**Error message:**`, `\`\`\``, input.errorMessage, `\`\`\``);
  }

  if (input.stackTrace) {
    parts.push(``, `**Stack trace:**`, `\`\`\``, input.stackTrace.slice(0, 1000), `\`\`\``);
  }

  if (input.context) {
    parts.push(
      ``,
      `**Context (what the agent was doing):**`,
      `\`\`\`json`,
      JSON.stringify(input.context, null, 2),
      `\`\`\``
    );
  }

  parts.push(
    ``,
    `## Instructions`,
    `1. Read the relevant source files to understand the current implementation.`,
    `2. Reproduce or understand the error from the information above.`,
    `3. Fix the root cause — do not just suppress the error.`,
    `4. Add a test if the fix is non-trivial.`,
    `5. Run \`npm test\` to verify nothing breaks.`,
  );

  return parts.join("\n");
}

/**
 * File a bug report. Called by agents when they hit errors.
 */
export async function fileBug(input: BugReportInput): Promise<number> {
  const fixPrompt = generateFixPrompt(input);

  const result = await db.insert(schema.bugs).values({
    title: input.title,
    description: input.description,
    reportedBy: input.reportedBy,
    severity: input.severity || "medium",
    status: "open",
    errorMessage: input.errorMessage || null,
    stackTrace: input.stackTrace || null,
    context: input.context ? JSON.stringify(input.context) : null,
    fixPrompt,
  });

  return Number(result.lastInsertRowid);
}

/**
 * Get all bug reports, optionally filtered by status.
 */
export async function getBugs(
  status?: string,
  limit: number = 50
): Promise<BugReport[]> {
  if (status) {
    return db
      .select()
      .from(schema.bugs)
      .where(eq(schema.bugs.status, status))
      .orderBy(desc(schema.bugs.createdAt))
      .limit(limit);
  }

  return db
    .select()
    .from(schema.bugs)
    .orderBy(desc(schema.bugs.createdAt))
    .limit(limit);
}

/**
 * Update bug status.
 */
export async function updateBugStatus(
  bugId: number,
  status: "open" | "in_progress" | "fixed" | "wont_fix"
): Promise<void> {
  await db
    .update(schema.bugs)
    .set({
      status,
      fixedAt: status === "fixed" ? new Date().toISOString() : null,
    })
    .where(eq(schema.bugs.id, bugId));
}

/**
 * Generate a single concatenated prompt for all open bugs.
 */
export async function getAllOpenBugPrompts(): Promise<string> {
  const openBugs = await getBugs("open");

  if (openBugs.length === 0) {
    return "No open bugs.";
  }

  const header = [
    `# Open Bug Reports (${openBugs.length})`,
    ``,
    `Fix all of the following bugs. Work through them one at a time.`,
    `After fixing each one, run \`npm test\` to verify.`,
    ``,
    `---`,
  ].join("\n");

  const bugPrompts = openBugs.map((bug, i) => {
    return [
      ``,
      `## Bug ${i + 1} of ${openBugs.length} (ID: ${bug.id}, Severity: ${bug.severity})`,
      ``,
      bug.fixPrompt,
      ``,
      `---`,
    ].join("\n");
  });

  return header + bugPrompts.join("\n");
}
