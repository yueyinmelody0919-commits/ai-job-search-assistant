/**
 * Agent Context System.
 *
 * Loads fresh context from the database before each agent response so agents
 * have awareness of: dashboard features, pipeline state, recent activity,
 * knowledge base, and pending actions.
 */

import { db, schema } from "../db";
import { desc, sql, eq } from "drizzle-orm";

const DASHBOARD_FEATURES = `
DASHBOARD FEATURES (you can reference these and send deep links):
- Morning Brief (/): Pipeline stats, approval queue, agent activity feed. "Scan for Jobs" and "Score Unscored Jobs" buttons.
- Job Feed (/feed): All discovered jobs with scores. Click a job for Company Dossier (radar chart, score breakdown, draft email, schedule follow-up). Thumbs up/down for feedback.
- Pipeline (/pipeline): Kanban board (Discovered→Queued→Outreached→Applied→Interviewing→Offer→Passed). Sankey flow diagram.
- Agents (/agents): React Flow orchestration diagram showing all 7 agents. Status, action counts, data flow.
- Network (/network): Company contact lookup via Apollo. Find people at target companies for warm intros.
- Learning (/learning): Skill recommendations, courses, progress tracking.
- Preferences (/preferences): Thompson Sampling weight visualization. Shows how scoring weights drift from feedback.
- Bugs (/bugs): Bug reports filed by agents. Each has a Claude-focused fix prompt. "Copy All Fix Prompts" button.
`.trim();

/**
 * Load fresh context for an agent response.
 * Returns a context string to prepend to the system prompt.
 */
export async function loadAgentContext(agentName: string): Promise<string> {
  const parts: string[] = [DASHBOARD_FEATURES];

  try {
    // Pipeline summary
    const stages = ["discovered", "queued", "outreached", "applied", "interviewing", "offer", "passed"];
    const stageCounts: string[] = [];
    for (const stage of stages) {
      const count = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.pipeline)
        .where(eq(schema.pipeline.stage, stage));
      const n = count[0]?.count ?? 0;
      if (n > 0) stageCounts.push(`${stage}: ${n}`);
    }
    if (stageCounts.length > 0) {
      parts.push(`\nCURRENT PIPELINE: ${stageCounts.join(", ")}`);
    }

    // Recent high-score jobs
    const topJobs = await db
      .select({
        title: schema.jobs.title,
        company: schema.jobs.company,
        score: sql<number>`(SELECT overall_score FROM job_scores WHERE job_id = jobs.id AND pass_number = 2 ORDER BY created_at DESC LIMIT 1)`,
      })
      .from(schema.jobs)
      .orderBy(desc(schema.jobs.scoredAt))
      .limit(5);

    const scoredJobs = topJobs.filter(j => j.score);
    if (scoredJobs.length > 0) {
      parts.push(`\nRECENT SCORED JOBS: ${scoredJobs.map(j => `${j.title} at ${j.company} (${j.score}/100)`).join("; ")}`);
    }

    // Recent agent activity (last 10 across all agents)
    const recentLogs = await db
      .select()
      .from(schema.agentLogs)
      .orderBy(desc(schema.agentLogs.createdAt))
      .limit(10);

    if (recentLogs.length > 0) {
      const logSummary = recentLogs
        .map(l => `${l.agent}: ${l.action} (${new Date(l.createdAt).toLocaleTimeString()})`)
        .join("; ");
      parts.push(`\nRECENT TEAM ACTIVITY: ${logSummary}`);
    }

    // Relevant knowledge for this agent
    const knowledge = await db
      .select()
      .from(schema.knowledge)
      .where(
        sql`${schema.knowledge.agent} = ${agentName} OR ${schema.knowledge.freshnessScore} >= 0.5`
      )
      .orderBy(desc(schema.knowledge.freshnessScore))
      .limit(5);

    if (knowledge.length > 0) {
      const knowledgeSummary = knowledge
        .map(k => `[${k.category}] ${k.title}: ${k.content.slice(0, 150)}`)
        .join("\n");
      parts.push(`\nKNOWLEDGE BASE:\n${knowledgeSummary}`);
    }

    // Open bugs
    const openBugs = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.bugs)
      .where(eq(schema.bugs.status, "open"));

    const bugCount = openBugs[0]?.count ?? 0;
    if (bugCount > 0) {
      parts.push(`\nOPEN BUGS: ${bugCount} (viewable at /bugs)`);
    }

    // Pending feedback count
    const feedbackCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.feedback);
    parts.push(`\nFEEDBACK SIGNALS RECEIVED: ${feedbackCount[0]?.count ?? 0} (Thompson Sampling converges at ~30)`);

  } catch {
    // If DB isn't ready, just use dashboard features
  }

  parts.push(`
IMPORTANT RULES:
- Before sending any email, you MUST ask the user for explicit permission first. Show them the draft and who it's going to.
- If you need clarification to do your job well, ask a follow-up question.
- Keep responses concise. Include relevant dashboard deep links.
- You can reference any of the above context in your responses.`);

  return parts.join("\n");
}
