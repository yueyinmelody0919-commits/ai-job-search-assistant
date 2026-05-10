import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  real,
} from "drizzle-orm/sqlite-core";

// ─── Jobs ────────────────────────────────────────────────────────
export const jobs = sqliteTable("jobs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  source: text("source").notNull(), // 'jsearch' | 'adzuna'
  externalId: text("external_id"),
  title: text("title").notNull(),
  company: text("company").notNull(),
  description: text("description"),
  url: text("url"),
  location: text("location"),
  salaryMin: real("salary_min"),
  salaryMax: real("salary_max"),
  salaryCurrency: text("salary_currency"),
  companyLogo: text("company_logo"),
  rawJson: text("raw_json"), // full API response
  discoveredAt: text("discovered_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  scoredAt: text("scored_at"),
});

// ─── Job Scores ──────────────────────────────────────────────────
export const jobScores = sqliteTable("job_scores", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  jobId: integer("job_id")
    .notNull()
    .references(() => jobs.id),
  dimension: text("dimension").notNull(),
  score: real("score").notNull(), // 1-5
  reason: text("reason"),
  overallScore: real("overall_score"), // 0-100 composite
  passNumber: integer("pass_number").notNull().default(1), // 1 = hard filter, 2 = LLM deep score
  scoredByAgent: text("scored_by_agent").default("analyst"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ─── Feedback ────────────────────────────────────────────────────
export const feedback = sqliteTable("feedback", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  jobId: integer("job_id").references(() => jobs.id),
  type: text("type").notNull(), // 'thumbs_up' | 'thumbs_down' | 'tag' | 'comment'
  tag: text("tag"), // 'wrong_seniority' | 'wrong_location' | 'not_ai_native' | etc.
  comment: text("comment"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ─── Preferences (Thompson Sampling) ────────────────────────────
export const preferences = sqliteTable("preferences", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  dimension: text("dimension").notNull().unique(),
  alpha: real("alpha").notNull().default(2), // Beta distribution param
  beta_param: real("beta_param").notNull().default(2), // Beta distribution param (avoiding reserved word)
  effectiveWeight: real("effective_weight").notNull(),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ─── Pipeline ────────────────────────────────────────────────────
export const pipeline = sqliteTable("pipeline", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  jobId: integer("job_id")
    .notNull()
    .references(() => jobs.id),
  stage: text("stage").notNull().default("discovered"),
  // stages: discovered | queued | outreached | applied | interviewing | offer | passed
  notes: text("notes"),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ─── Contacts ────────────────────────────────────────────────────
export const contacts = sqliteTable("contacts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  company: text("company"),
  title: text("title"),
  email: text("email"),
  linkedinUrl: text("linkedin_url"),
  source: text("source").default("apollo"), // 'apollo' | 'manual' | 'google_contacts'
  relationship: text("relationship"), // 'cold' | 'warm' | 'mutual_connection'
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ─── Knowledge Base (shared agent memory) ────────────────────────
export const knowledge = sqliteTable("knowledge", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  category: text("category").notNull(), // 'market' | 'company' | 'skill' | 'tool' | 'trend'
  title: text("title").notNull(),
  content: text("content").notNull(),
  sourceUrl: text("source_url"),
  agent: text("agent").notNull(), // which agent wrote this
  freshnessScore: real("freshness_score").default(1.0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  expiresAt: text("expires_at"),
});

// ─── Agent Logs ──────────────────────────────────────────────────
export const agentLogs = sqliteTable("agent_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  agent: text("agent").notNull(),
  action: text("action").notNull(),
  details: text("details"), // JSON string
  outcome: text("outcome"), // 'success' | 'failure' | 'pending'
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ─── Agent Learnings (self-improvement) ──────────────────────────
export const agentLearnings = sqliteTable("agent_learnings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  agent: text("agent").notNull(),
  learning: text("learning").notNull(),
  appliedToPrompt: integer("applied_to_prompt", { mode: "boolean" }).default(
    false
  ),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ─── Features (Engineer ideas) ──────────────────────────────────
export const features = sqliteTable("features", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("idea"), // 'idea' | 'approved' | 'building' | 'shipped'
  suggestedBy: text("suggested_by").default("engineer"),
  priority: text("priority").default("medium"), // 'low' | 'medium' | 'high'
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ─── Skills (L&D Coach) ─────────────────────────────────────────
export const skills = sqliteTable("skills", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  topic: text("topic").notNull(),
  relevance: text("relevance"), // why this skill matters for the job search
  resourcesJson: text("resources_json"), // JSON array of links/courses
  status: text("status").notNull().default("suggested"), // 'suggested' | 'in_progress' | 'completed'
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ─── Whitelist ───────────────────────────────────────────────────
export const whitelist = sqliteTable("whitelist", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  approvedBy: text("approved_by").default("system"),
  approvedAt: text("approved_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ─── Bug Reports ─────────────────────────────────────────────────
export const bugs = sqliteTable("bugs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  reportedBy: text("reported_by").notNull(), // agent name
  severity: text("severity").notNull().default("medium"), // 'low' | 'medium' | 'high' | 'critical'
  status: text("status").notNull().default("open"), // 'open' | 'in_progress' | 'fixed' | 'wont_fix'
  errorMessage: text("error_message"),
  stackTrace: text("stack_trace"),
  context: text("context"), // JSON: what the agent was doing when the bug occurred
  fixPrompt: text("fix_prompt").notNull(), // Claude-focused prompt for fixing the bug
  fixedAt: text("fixed_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ─── Meme Log ────────────────────────────────────────────────────
export const memeLog = sqliteTable("meme_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  agent: text("agent").notNull(),
  memeUrl: text("meme_url").notNull(),
  context: text("context"),
  sentAt: text("sent_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ─── Agent Configs (runtime capability overrides) ───────────────
export const agentConfigs = sqliteTable("agent_configs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  agent: text("agent").notNull(),
  capability: text("capability").notNull(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ─── Type Exports ────────────────────────────────────────────────
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
export type JobScore = typeof jobScores.$inferSelect;
export type Feedback = typeof feedback.$inferSelect;
export type Preference = typeof preferences.$inferSelect;
export type PipelineEntry = typeof pipeline.$inferSelect;
export type Contact = typeof contacts.$inferSelect;
export type KnowledgeEntry = typeof knowledge.$inferSelect;
export type AgentLog = typeof agentLogs.$inferSelect;
export type Feature = typeof features.$inferSelect;
export type Skill = typeof skills.$inferSelect;
export type WhitelistEntry = typeof whitelist.$inferSelect;
export type BugReport = typeof bugs.$inferSelect;
export type NewBugReport = typeof bugs.$inferInsert;
export type AgentConfigEntry = typeof agentConfigs.$inferSelect;
