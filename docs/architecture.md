# System Architecture

## Overview

Melody's AI Colleague Team is a multi-agent job search assistant that mirrors Leena AI's product architecture: an orchestrator coordinating specialized AI agents with deep integrations into external systems and a shared memory layer.

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                    MELODY'S AI COLLEAGUE TEAM                     │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │              CENTRAL MEMORY SYSTEM (SQLite)                  │  │
│  │                                                               │  │
│  │  jobs · job_scores · feedback · preferences · pipeline        │  │
│  │  contacts · knowledge · agent_logs · agent_learnings          │  │
│  │  features · skills · whitelist · meme_log                     │  │
│  └─────────────┬───────────────────────────────┬───────────────┘  │
│                │                               │                   │
│  ┌─────────────▼───────────────┐  ┌────────────▼────────────┐    │
│  │     SLACK LAYER             │  │   DASHBOARD (Next.js)    │    │
│  │                             │  │                          │    │
│  │  Scout (Dwight) ─ Discovery │  │  Morning Brief           │    │
│  │  Analyst (Oscar) ─ Scoring  │  │  Job Feed + Dossier      │    │
│  │  Strategist (Jim) ─ Outreach│  │  Pipeline Kanban+Sankey  │    │
│  │  Ops (Angela) ─ Pipeline    │  │  Agent Orchestration     │    │
│  │  Engineer (Darryl) ─ DevOps │  │  Network Map             │    │
│  │  Coach (Holly) ─ L&D        │  │  Preferences + Learning  │    │
│  │  QA (Stanley) ─ Quality     │  │                          │    │
│  │                             │  │  Auth: Google OAuth       │    │
│  │  Socket Mode · Meme Engine  │  │  Whitelist via Darryl    │    │
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
│  │  Claude API ───── Scoring, drafting, agent brains             │ │
│  │  Tavily API ───── Web search for agent research               │ │
│  │                                                               │ │
│  └───────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

## Scoring System

Two-pass architecture:

1. **Pass 1 (Hard Filter)**: Instant binary gates (seniority, function, location, company type). No LLM cost.
2. **Pass 2 (Deep Score)**: Claude API with structured JSON rubric across 9 weighted dimensions.

### Preference Learning

Thompson Sampling (Bayesian multi-armed bandit):
- Each dimension modeled as Beta(alpha, beta) distribution
- Feedback updates posteriors → weights shift over time
- Converges after ~30 signals
- Same technique used by LinkedIn and DoorDash

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, shadcn/ui, Tailwind CSS |
| Visualization | React Flow, Nivo (Sankey, Radar), Recharts |
| Animation | Framer Motion |
| Backend | Next.js API Routes |
| Database | SQLite via Drizzle ORM (12 tables) |
| AI | Claude API (Anthropic) |
| Slack | Bolt SDK, Socket Mode |
| Auth | Auth.js v5, Google OAuth |
| Testing | Vitest, 52+ tests, Husky hooks |
| Deployment | Vercel (dashboard) + Railway (Slack bots) |

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
1. **DMs**: User messages a specific agent directly
2. **@mentions**: Agents tag each other in channels for handoffs
3. **Shared Memory**: All agents read/write to the same SQLite tables

The AgentRouter determines which agent handles each message based on:
- DM recipient (specific bot)
- @mention in channel messages
- Keyword-based fallback routing
