# System Architecture

## Overview

**Job Search OS** is a multi-agent operating system for running a modern job
search. A senior job search is really a small operation: you have to discover
roles across many sources, evaluate them against a nuanced set of criteria,
research companies and people, run personalized outreach, track a pipeline of
opportunities, and prepare for interviews — all at once, all the time.

The architecture models that operation directly. Instead of one monolithic
assistant, the work is split across **specialized AI agents**, each owning a
stage of the funnel, coordinating through a **shared memory layer** and a
**message router**, with **deep integrations** into the systems where the work
actually happens (job boards, email, calendar, spreadsheets, contact data,
web search, and an LLM for reasoning).

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                          JOB SEARCH OS                            │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │              CENTRAL MEMORY SYSTEM (SQLite)                  │  │
│  │                                                               │  │
│  │  jobs · job_scores · feedback · preferences · pipeline        │  │
│  │  contacts · knowledge · agent_logs · agent_learnings          │  │
│  │  features · skills · whitelist · bugs · agent_configs         │  │
│  └─────────────┬───────────────────────────────┬───────────────┘  │
│                │                               │                   │
│  ┌─────────────▼───────────────┐  ┌────────────▼────────────┐    │
│  │     SLACK LAYER             │  │   DASHBOARD (Next.js)    │    │
│  │                             │  │                          │    │
│  │  Scout ─ Discovery          │  │  Morning Brief           │    │
│  │  Analyst ─ Scoring          │  │  Job Feed + Dossier      │    │
│  │  Strategist ─ Outreach      │  │  Pipeline Kanban+Sankey  │    │
│  │  Ops ─ Pipeline             │  │  Agent Orchestration     │    │
│  │  Engineer ─ Platform        │  │  Network Map             │    │
│  │  Coach ─ Learning           │  │  Preferences + Learning  │    │
│  │  QA ─ Quality               │  │                          │    │
│  │                             │  │  Auth: Google OAuth       │    │
│  │  Socket Mode                │  │  Access via whitelist    │    │
│  └─────────────────────────────┘  └─────────────────────────┘    │
│                                                                    │
│  ┌─────────────────── INTEGRATIONS (9) ─────────────────────────┐ │
│  │                                                               │ │
│  │  JSearch API ──── Real-time job listings (LinkedIn/Indeed)     │ │
│  │  Adzuna API ───── Job listings + salary data                  │ │
│  │  Gmail API ────── Draft/send outreach emails                  │ │
│  │  Sheets API ───── Application tracker CRM                     │ │
│  │  Calendar API ─── Follow-ups + interview prep                 │ │
│  │  Apollo.io API ── People search + company enrichment          │ │
│  │  Slack API ────── 7 bot apps (Socket Mode)                    │ │
│  │  Claude API ───── Scoring, drafting, agent reasoning          │ │
│  │  Tavily API ───── Web search for agent research               │ │
│  │                                                               │ │
│  └───────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

## Scoring System

Two-pass architecture:

1. **Pass 1 (Hard Filter)**: Instant binary gates (seniority, function,
   location, company type, optional salary floor). No LLM cost.
2. **Pass 2 (Deep Score)**: Claude API with a structured JSON rubric across
   9 weighted dimensions.

### Preference Learning

Thompson Sampling (Bayesian multi-armed bandit):
- Each dimension modeled as a Beta(alpha, beta) distribution
- Feedback updates posteriors → weights shift over time
- Converges after ~30 signals
- The same technique used in large-scale recommendation and ranking systems

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, shadcn/ui, Tailwind CSS |
| Visualization | React Flow, Nivo (Sankey, Radar), Recharts |
| Animation | Framer Motion |
| Backend | Next.js API Routes |
| Database | SQLite via Drizzle ORM |
| AI | Claude API (Anthropic) |
| Slack | Bolt SDK, Socket Mode |
| Auth | Auth.js v5, Google OAuth |
| Testing | Vitest, Husky hooks |

## Data Flow

```
Job API (JSearch/Adzuna)
  → Hard Filter (Pass 1)
  → SQLite jobs table
  → Claude Scoring (Pass 2)
  → job_scores table
  → Pipeline (discovered → queued → outreached → ...)
  → Actions (Gmail, Calendar, Sheets)
  → Feedback loop → Thompson Sampling → weight updates
```

## Agent Communication

Agents communicate via Slack using three patterns:
1. **DMs**: You message a specific agent directly
2. **@mentions**: Agents tag each other in channels for handoffs
3. **Shared Memory**: All agents read/write to the same SQLite tables

The message router determines which agent handles each message based on:
- DM recipient (specific bot)
- @mention in channel messages
- Keyword-based fallback routing
