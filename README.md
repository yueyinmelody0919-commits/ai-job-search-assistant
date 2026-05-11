# Melody's AI Colleague Team

A multi-agent Job Search Assistant built with [Claude Code](https://claude.ai/claude-code) for the Leena AI Director of Strategy & Operations assignment.

**GitHub**: [github.com/yueyinmelody0919-commits/leena-job-search-assistant](https://github.com/yueyinmelody0919-commits/leena-job-search-assistant)

> **Build something you'd actually use.** I built a miniature version of Leena's product - for my own job search.

---

## Table of Contents

- [What This Is](#what-this-is)
- [Why This Architecture](#why-this-architecture)
- [System Architecture](#system-architecture)
- [Agent Orchestration](#agent-orchestration)
- [Scoring Engine](#scoring-engine)
- [Integrations](#integrations)
- [Dashboard](#dashboard)
- [Key Technical Decisions](#key-technical-decisions)
- [Deliverables](#deliverables)
- [Setup](#setup)

---

## What This Is

An autonomous AI colleague team that finds, evaluates, and acts on job opportunities. Seven AI colleagues - each with a distinct role and an Office character personality - collaborate via Slack and a dashboard to run a job search like a GTM pipeline.

**By the numbers:**
- 11,300+ lines of TypeScript across 85 files
- 9 live external integrations (asked for 3)
- 7 AI agents with runtime-configurable capabilities
- 52+ passing tests with TDD pre-push hooks
- 14 database tables with shared memory
- 436+ messages of prompting history documented

---

## Why This Architecture

The assignment asks for a job search tool. I built a **multi-agent orchestration system** instead - because that's what Leena AI builds.

| Leena AI Product | This Project |
|---|---|
| AI Colleagues with distinct roles | 7 agents: Scout, Analyst, Strategist, Ops, Engineer, Coach, QA |
| Orchestrator coordinating agents | Central router dispatching messages to 1-3 relevant agents |
| Deep enterprise integrations | 9 live connectors with real read/write operations |
| Shared knowledge across agents | SQLite memory system with 14 tables |
| Runtime-configurable capabilities | Toggle agent capabilities on/off from the dashboard |
| Human-in-the-loop approval | Thumbs up/down feedback, manual email review before send |
| Autonomous workflows | Scheduled scans, auto-scoring, draft email generation |

This isn't a coincidence. I studied the product and built something that demonstrates I understand how it works at an architectural level.

---

## System Architecture

```mermaid
graph TB
    subgraph External["External Systems (9 Live Integrations)"]
        JS[JSearch API]
        AZ[Adzuna API]
        GM[Gmail API]
        GS[Google Sheets]
        GC[Google Calendar]
        AP[Apollo.io]
        SL[Slack - 7 Bots]
        CL[Claude API]
        TV[Tavily Web Search]
    end

    subgraph Core["Core Engine"]
        OR[Message Router]
        SC[Scoring Engine]
        TS[Thompson Sampling]
        CT[Contact Research]
    end

    subgraph Agents["AI Colleagues"]
        A1["Scout (Dwight)\nDiscovery"]
        A2["Analyst (Oscar)\nScoring"]
        A3["Strategist (Jim)\nOutreach"]
        A4["Ops (Angela)\nPipeline"]
        A5["Engineer (Darryl)\nPlatform"]
        A6["Coach (Holly)\nL&D"]
        A7["QA (Stanley)\nQuality"]
    end

    subgraph Data["Shared Memory (SQLite)"]
        DB[(14 Tables)]
    end

    subgraph UI["Dashboard (Next.js)"]
        MB[Morning Brief]
        JF[Job Feed]
        PL[Pipeline]
        AG[Agent Settings]
        NW[Network Map]
        PR[Preferences]
    end

    SL --> OR
    OR --> A1 & A2 & A3 & A4 & A5 & A6 & A7
    A1 --> JS & AZ & TV
    A2 --> CL & SC
    A3 --> GM & AP & CT
    A4 --> GS & GC
    SC --> TS
    A1 & A2 & A3 & A4 & A5 & A6 & A7 --> DB
    DB --> UI
    UI --> DB
```

### Data Flow

```mermaid
flowchart LR
    A[Scan Jobs] -->|JSearch + Adzuna| B[Hard Filter]
    B -->|Pass 5 gates| C[Store in DB]
    B -->|Fail any gate| X[Rejected]
    C --> D[Score via Claude]
    D -->|9 dimensions| E[Composite Score]
    E -->|70+| F[Draft Email]
    E -->|< 70| G[Feed for Review]
    F -->|Contact Research| H[Gmail Draft]
    H --> I[Slack Digest]
    G -->|Thumbs Up| F
    G -->|Thumbs Down| J[Passed / Removed]
    J -->|Update weights| D
```

---

## Agent Orchestration

Each agent is a `BaseAgent` instance with a character persona, a system prompt, and a set of capabilities that can be toggled at runtime from the dashboard.

```mermaid
graph LR
    subgraph Message Flow
        U[User Message] --> R[Router]
        R -->|Job search| S[Scout]
        R -->|Score question| A[Analyst]
        R -->|Email/outreach| ST[Strategist]
        R -->|Pipeline/schedule| O[Ops]
        R -->|Feature request| E[Engineer]
        R -->|Learning| C[Coach]
        R -->|Bug report| Q[QA]
    end

    subgraph Runtime Config
        DB[(agent_configs)] -->|Load on each request| S & A & ST & O & E & C & Q
    end
```

**How it works:**
1. User sends a message in Slack (DM or #job-search channel)
2. The router analyzes the message and dispatches to 1-3 relevant agents
3. Each agent loads its **enabled capabilities** from the database (not hardcoded)
4. The agent calls Claude with its persona prompt + fresh context from the shared memory
5. Response is posted back to Slack using that agent's bot token

**Runtime configurability:** Every agent's capabilities can be toggled on/off from the Agents page. When a capability is disabled, it's removed from the agent's system prompt, so Claude won't attempt to use it. This mirrors Leena's approach to capability management.

### The Colleagues

| Agent | Character | Role | Key Capabilities |
|-------|-----------|------|-----------------|
| Scout | Dwight Schrute | Discovery & Research | Search JSearch, Search Adzuna, Research via Tavily |
| Analyst | Oscar Martinez | Scoring & Market Intel | Score via Claude, Update Thompson Sampling, Process feedback |
| Strategist | Jim Halpert | Outreach & Networking | Draft emails, Send via Gmail, Look up contacts |
| Ops | Angela Martin | Pipeline & Scheduling | Pipeline stages, Calendar events, Sheets tracker |
| Engineer | Darryl Philbin | Platform Development | Whitelist, Feature suggestions, Performance monitoring |
| Coach | Holly Flax | Learning & Development | Learning resources, Skill gaps, Course search |
| QA | Stanley Hudson | Quality Assurance | Bug investigation, Test monitoring, Error tracking |

---

## Scoring Engine

### Two-Pass Architecture

```mermaid
flowchart TD
    J[Raw Job Listing] --> P1{Pass 1: Hard Filter}
    P1 -->|"Seniority in TITLE\n(Director, VP, CoS)"| G1[Gate 1]
    G1 -->|"Function match\n(GTM, Strategy, Biz Ops)"| G2[Gate 2]
    G2 -->|"Location\n(NYC, Bay Area, Remote)"| G3[Gate 3]
    G3 -->|"Company type\n(B2B, SaaS, Tech, AI)"| G4[Gate 4]
    G4 -->|"Salary floor\n($300K+ if listed)"| G5[Gate 5]
    G5 -->|All pass| P2[Pass 2: LLM Score]
    P1 -->|Any fail| R[Rejected]
    G1 -->|Fail| R
    G2 -->|Fail| R
    G3 -->|Fail| R
    G4 -->|Fail| R

    P2 -->|Claude API| SC[9 Dimension Scores]
    SC --> W[Apply Preference Weights]
    W --> CS[Composite Score 0-100]

    FB[User Feedback] -->|Thumbs up/down| TS[Thompson Sampling]
    TS -->|Update Beta distributions| W
```

**Pass 1** eliminates ~70% of listings instantly with no API cost. The key design decision: seniority keywords must appear in the job **title**, not the description, to avoid false positives from JDs that mention "reports to the Director."

**Pass 2** sends each surviving job to Claude with a structured prompt that returns JSON scores across 9 dimensions. The composite score is computed using preference weights from Thompson Sampling - not Claude's self-reported overall score.

### Thompson Sampling (Preference Learning)

Each scoring dimension is modeled as a Beta(alpha, beta) distribution. When the user gives feedback:

- **Thumbs up** on a job: alpha increases for that job's high-scoring dimensions (reinforces what you like)
- **Thumbs down**: beta increases for high-scoring dimensions (penalizes overweighted criteria)
- **Thumbs up also boosts** the job's composite score to a minimum of 70, making it eligible for outreach
- **Thumbs down removes** the job from the active feed (moved to "passed" stage)

After ~30 feedback signals, the weights converge on the user's true preferences. The Preferences dashboard shows real-time weight drift.

---

## Integrations

### Integration Architecture

```mermaid
graph TB
    subgraph "Read Operations"
        R1[JSearch] -->|"Job listings\nLinkedIn, Indeed, Glassdoor"| DB[(SQLite)]
        R2[Adzuna] -->|"Job listings\n+ salary data"| DB
        R3[Apollo] -->|"People at companies\nemail, title, LinkedIn"| DB
        R4[Tavily] -->|"Web search\ncompany research"| DB
    end

    subgraph "Read + Write Operations"
        RW1[Gmail] -->|"Read: thread status\nWrite: draft + send emails"| DB
        RW2[Sheets] -->|"Read: pipeline state\nWrite: job tracking"| DB
        RW3[Calendar] -->|"Read: availability\nWrite: follow-ups, prep"| DB
        RW4[Slack] -->|"Read: messages\nWrite: responses, digests"| DB
    end

    subgraph "AI Operations"
        AI1[Claude API] -->|"Scoring, drafting\ncontact research\nagent responses"| DB
    end
```

### Email Outreach Pipeline

The email system is a key differentiator - it doesn't just draft, it **researches, personalizes, and queues**:

1. **Contact Research**: Claude analyzes the job posting and company to find the right email (careers@company.com, or a specific recruiter)
2. **Personalized Greeting**: "Dear Recruiting Team" for generic addresses, first name for individuals
3. **Template with Context**: Body references the specific role and company, not a generic template
4. **Resume Attached**: PDF automatically attached as MIME multipart
5. **Gmail Draft**: Saved to drafts for human review - never auto-sent
6. **Slack Notification**: Digest with links to both the dashboard dossier and the Gmail draft

---

## Dashboard

Eight views, each wired to real data from the shared SQLite database:

| View | Purpose | Key Features |
|------|---------|-------------|
| **Morning Brief** | Daily overview | Stats row, approval queue (clickable), agent activity feed, scan/score buttons |
| **Job Feed** | Browse & act on jobs | Score badges, thumbs up/down, company dossier with description + radar chart + score breakdown table |
| **Pipeline** | Track job stages | Kanban board (7 stages), Sankey flow diagram |
| **Agents** | Configure agents | Activity log, capability toggles (runtime), scheduled tasks, knowledge base |
| **Network** | Contact lookup | Apollo search, batch populate from top-scored jobs |
| **Bugs** | Track issues | Auto-generated fix prompts, severity/status tracking |
| **Learning** | Skill development | Resource links, skill gap analysis |
| **Preferences** | Scoring weights | Thompson Sampling visualization, feedback history, hard filters |

### Design System

The dashboard uses Leena AI's brand palette (#0F72EE primary blue, light backgrounds, #CFE3FC borders) with Claude platform-style clean components (shadcn/ui).

---

## Key Technical Decisions

| Decision | Why |
|----------|-----|
| **SQLite over Postgres** | Single-file DB, zero infrastructure, perfect for a self-contained tool |
| **Thompson Sampling over static weights** | Real ML technique used by LinkedIn/DoorDash - demonstrates analytical sophistication |
| **Seniority filter on TITLE only** | JDs mention "Director" in descriptions ("reports to Director") - filtering on title avoids false positives |
| **Composite score computed locally** | Claude's self-reported "overall" was unreliable (all scored 32) - computing from per-dimension scores x weights fixed it |
| **7 Slack apps, not 1** | Each agent has its own bot token and avatar - feels like real colleagues, not one bot with multiple personalities |
| **Drafts, not auto-send** | Human-in-the-loop for outreach emails - the system prepares, you approve |
| **Agent configs in DB, not code** | Runtime-configurable capabilities, not hardcoded - mirrors how enterprise AI products manage agent behavior |

---

## Database Schema

```mermaid
erDiagram
    jobs ||--o{ job_scores : scores
    jobs ||--o{ pipeline : tracked_in
    jobs ||--o{ feedback : receives
    preferences ||--|| feedback : updated_by
    agent_configs ||--|| agent_logs : configures
    contacts }|--|| knowledge : enriches

    jobs {
        int id PK
        string title
        string company
        text description
        string location
        real salary_min
        real salary_max
        string url
        string source
    }

    job_scores {
        int id PK
        int job_id FK
        string dimension
        real score
        text reason
        real overall_score
        int pass_number
    }

    pipeline {
        int id PK
        int job_id FK
        string stage
        text notes
    }

    feedback {
        int id PK
        int job_id FK
        string type
        text comment
    }

    preferences {
        int id PK
        string dimension
        real alpha
        real beta_param
        real effective_weight
    }

    agent_configs {
        int id PK
        string agent
        string capability
        boolean enabled
    }

    agent_logs {
        int id PK
        string agent
        string action
        text details
    }
```

14 tables total: jobs, job_scores, feedback, preferences, pipeline, contacts, knowledge, agent_logs, agent_learnings, features, skills, whitelist, bugs, agent_configs.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | shadcn/ui, Tailwind CSS |
| Charts | Nivo (Sankey, Radar) |
| Database | SQLite via Drizzle ORM (@libsql/client) |
| AI | Claude API (Anthropic) |
| Slack | Bolt SDK, Socket Mode |
| Auth | Auth.js v5, Google OAuth |
| Testing | Vitest, 52+ tests |
| CI/Quality | Husky hooks (typecheck + lint pre-commit, tests pre-push) |
| Dev Tool | Claude Code (entire project built with it) |

---

## Deliverables

| Deliverable | Location | Description |
|-------------|----------|-------------|
| **Flow walkthrough** | [`docs/walkthrough-script.md`](./docs/walkthrough-script.md) | 10-15 min demo script with 7 acts and checklist |
| **Code** | This repo | 11,300+ lines, 85 files, 17 commits |
| **Scoring note** | [`SCORING_NOTE.md`](./SCORING_NOTE.md) | Half-page: two-pass architecture, Thompson Sampling, exclusions |
| **Prompting history** | [`FULL_CHAT_HISTORY.md`](./FULL_CHAT_HISTORY.md) | 233KB, 436+ messages - complete build session log |

---

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

### Required API Keys

| Key | Source | Free Tier |
|-----|--------|-----------|
| ANTHROPIC_API_KEY | [console.anthropic.com](https://console.anthropic.com) | Pay-as-you-go |
| RAPIDAPI_KEY (JSearch) | [rapidapi.com](https://rapidapi.com) | 500 req/mo |
| ADZUNA_APP_ID + KEY | [developer.adzuna.com](https://developer.adzuna.com) | Free |
| GOOGLE_CLIENT_ID/SECRET/REFRESH_TOKEN | Google Cloud Console | Free |
| APOLLO_API_KEY | [app.apollo.io](https://app.apollo.io) | 50 credits/mo |
| TAVILY_API_KEY | [tavily.com](https://tavily.com) | 1,000 searches/mo |
| SLACK_*_BOT_TOKEN (x7) | [api.slack.com](https://api.slack.com) | Free |

---

*Built by Melody Yin using Claude Code, May 2026*
