# Melody's AI Colleague Team

A multi-agent Job Search Assistant built with Claude Code for the Leena AI Director of Strategy & Operations interview assignment.

## What This Is

An autonomous AI colleague team that finds, evaluates, and acts on job opportunities on your behalf. Seven AI colleagues — each with distinct personalities inspired by The Office — collaborate via Slack and a mission-control dashboard to run your job search like a GTM pipeline.

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    AI COLLEAGUE TEAM                              │
│                                                                    │
│  ┌───────────────────────────────────────────────────────────┐    │
│  │           CENTRAL MEMORY SYSTEM (SQLite)                   │    │
│  └───────────┬─────────────────────────────────┬─────────────┘    │
│              │                                 │                   │
│  ┌───────────▼────────────┐  ┌─────────────────▼──────────────┐  │
│  │   SLACK LAYER          │  │   DASHBOARD (Next.js)           │  │
│  │   7 Bot Personas       │  │   Dark mode mission control    │  │
│  │   Socket Mode          │  │   Google Auth + Whitelist       │  │
│  └────────────────────────┘  └────────────────────────────────┘  │
│                                                                    │
│  ┌─────────────────── INTEGRATIONS ──────────────────────────┐   │
│  │ JSearch · Adzuna · Gmail · Sheets · Calendar · Apollo     │   │
│  │ Slack · Claude API · Web Search (Tavily)                  │   │
│  └───────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

## The Colleagues

| Agent | Character | Role |
|-------|-----------|------|
| Scout | Dwight Schrute | Discovery & Research |
| Analyst | Oscar Martinez | Scoring & Market Intel |
| Strategist | Jim Halpert | Outreach & Networking |
| Ops | Angela Martin | Pipeline & Scheduling |
| Engineer | Darryl Philbin | Platform Development |
| L&D Coach | Holly Flax | Learning & Development |
| QA | Stanley Hudson | Quality Assurance |

## Key Features

- **9 live external integrations** (JSearch, Adzuna, Gmail, Sheets, Calendar, Apollo, Slack, Claude API, Tavily)
- **Two-pass scoring**: Hard filter + LLM deep analysis with structured rubric
- **Thompson Sampling**: Bayesian preference learning from your feedback
- **Auto vs Manual mode**: Toggle between autonomous operation and manual approval
- **Mission control dashboard**: Morning brief, job feed, pipeline kanban, agent orchestration, network map
- **Office-themed personalities**: Memes, banter, and distinct character voices

## Tech Stack

- **Frontend**: Next.js 16, shadcn/ui, Tailwind CSS, Recharts, Nivo, React Flow, Framer Motion
- **Backend**: Next.js API routes, SQLite via Drizzle ORM
- **AI**: Claude API (Anthropic) for scoring, drafting, agent brains
- **Slack**: Bolt SDK, Socket Mode, 7 bot apps
- **Auth**: Auth.js v5 with Google OAuth + email whitelist
- **Testing**: Vitest, TDD with pre-push hooks

## Setup

### Prerequisites

- Node.js 20+
- npm
- A Slack workspace (free tier works)

### Installation

```bash
git clone https://github.com/yueyinmelody0919-commits/leena-job-search-assistant.git
cd leena-job-search-assistant
npm install
cp .env.example .env
# Fill in your API keys (see .env.example for instructions)
```

### Run Locally

```bash
# Dashboard
npm run dev

# Slack bots (separate terminal)
npm run slack:dev
```

### Run Tests

```bash
npm test
```

## Deliverables

| Deliverable | Location |
|-------------|----------|
| Flow walkthrough | `docs/walkthrough-script.md` |
| Code | This repo |
| Scoring note | `SCORING_NOTE.md` |
| Build log | `BUILD_LOG.md` |
| Architecture docs | `docs/architecture.md` |

## Scoring Methodology

See [SCORING_NOTE.md](./SCORING_NOTE.md) for the half-page scoring methodology, including:
- Two-pass scoring architecture
- Thompson Sampling preference learning
- Weighted rubric with 9 dimensions
- What was excluded and why

## Built With

Built entirely using [Claude Code](https://claude.ai/claude-code) by Anthropic — demonstrating AI-native development from architecture to deployment.

---

*Built by Melody Yin for the Leena AI interview assignment, May 2026*
