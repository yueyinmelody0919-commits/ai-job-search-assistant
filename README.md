# Melody's AI Colleague Team

A multi-agent Job Search Assistant built with [Claude Code](https://claude.ai/claude-code) for the Leena AI Director of Strategy & Operations assignment.

**GitHub**: [github.com/yueyinmelody0919-commits/leena-job-search-assistant](https://github.com/yueyinmelody0919-commits/leena-job-search-assistant)

## What This Is

An autonomous AI colleague team that finds, evaluates, and acts on job opportunities. Seven AI colleagues - each with The Office personalities - collaborate via Slack and a dashboard to run a job search like a GTM pipeline.

The architecture mirrors Leena AI's product: an orchestrator coordinating specialized agents with shared memory, deep integrations, and runtime-configurable capabilities.

## Live Integrations (9 systems, asked for 3)

| # | System | Read | Write |
|---|--------|------|-------|
| 1 | **JSearch** (RapidAPI) | Job listings from LinkedIn/Indeed/Glassdoor | - |
| 2 | **Adzuna** | Job listings + salary data | - |
| 3 | **Gmail API** | Thread status | Draft + send outreach emails with resume |
| 4 | **Google Sheets** | Pipeline state | Write jobs, update stages |
| 5 | **Google Calendar** | Availability | Follow-up reminders, interview prep |
| 6 | **Apollo.io** | People at companies | - |
| 7 | **Slack** (7 bot apps) | Messages, mentions | Agent responses, digests, memes |
| 8 | **Claude API** | - | Scoring, drafting, agent responses |
| 9 | **Tavily** | Web search | Market research, company intel |

## The Colleagues

| Agent | Character | Role |
|-------|-----------|------|
| Scout | Dwight Schrute | Discovery & Research |
| Analyst | Oscar Martinez | Scoring & Market Intel |
| Strategist | Jim Halpert | Outreach & Networking |
| Ops | Angela Martin | Pipeline & Scheduling |
| Engineer | Darryl Philbin | Platform Development |
| Coach | Holly Flax | Learning & Development |
| QA | Stanley Hudson | Quality Assurance |

## Key Features

- **Two-pass scoring**: Hard filter (seniority, function, location, company type, salary floor) + LLM deep analysis with 9-dimension structured rubric
- **Thompson Sampling**: Bayesian preference learning - weights shift based on thumbs up/down feedback
- **Live email outreach**: Gmail drafts with resume attached, contact research via Claude, personalized greetings
- **Slack digests**: Daily summary of 70+ scored jobs with links to dashboard + Gmail drafts
- **Editable agent configs**: Toggle capabilities on/off at runtime, changes propagate to agent behavior
- **Interactive feedback**: Thumbs up boosts scores to 70+, thumbs down removes from feed and updates weights
- **Pipeline tracking**: Kanban board with Sankey flow visualization

## Dashboard Views

1. **Morning Brief** - Stats, approval queue with clickable jobs, agent activity feed
2. **Job Feed** - Scored jobs with thumbs up/down, company dossier with description + score breakdown
3. **Pipeline** - Kanban + Sankey diagram
4. **Agents** - Agent cards with detail view: activity, capabilities (editable), schedule, knowledge
5. **Network** - Apollo contact lookup + batch populate from top jobs
6. **Bugs** - Bug reports with auto-generated fix prompts
7. **Learning** - L&D recommendations with real resource links
8. **Preferences** - Live Thompson Sampling weights, feedback history, hard filters

## Tech Stack

- **Frontend**: Next.js 16, shadcn/ui, Tailwind CSS, Nivo (Sankey, Radar), React Flow
- **Backend**: Next.js API routes, SQLite via Drizzle ORM (@libsql/client)
- **AI**: Claude API for scoring, email drafting, contact research, agent responses
- **Slack**: Bolt SDK, Socket Mode, 7 bot apps with Office personalities
- **Auth**: Auth.js v5, Google OAuth, email whitelist
- **Testing**: Vitest, 52+ tests, TDD with Husky pre-push hooks

## Setup

```bash
git clone https://github.com/yueyinmelody0919-commits/leena-job-search-assistant.git
cd leena-job-search-assistant
npm install
cp .env.example .env
# Fill in API keys (see .env.example)

npm run db:seed    # Initialize preferences + agent configs
npm run dev        # Dashboard at localhost:3000
npm run slack:dev  # Slack bots (separate terminal)
npm test           # 52+ passing tests
```

## Deliverables

| Deliverable | Location |
|-------------|----------|
| Flow walkthrough | [`docs/walkthrough-script.md`](./docs/walkthrough-script.md) |
| Code | This repo |
| Scoring note | [`SCORING_NOTE.md`](./SCORING_NOTE.md) |
| Prompting history | [`FULL_CHAT_HISTORY.md`](./FULL_CHAT_HISTORY.md) (231KB, 429 messages) |

## Scoring Methodology

See [SCORING_NOTE.md](./SCORING_NOTE.md) - two-pass architecture, Thompson Sampling preference learning, 9 weighted dimensions, and what was excluded.

---

*Built by Melody Yin using Claude Code, May 2026*
