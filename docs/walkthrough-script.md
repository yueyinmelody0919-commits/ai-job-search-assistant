# Flow Walkthrough (10-15 min)

## Setup
- Dashboard open at localhost:3000
- Slack workspace open with #job-search channel visible
- Gmail (Wildkittens) open showing Drafts folder

---

## Opening: Why I Built It This Way (1 min)

*Dashboard visible in background. Speak directly.*

"Before I show you the tool, I want to share why I designed it the way I did.

The assignment says build a job search assistant. I could have built a single script that scrapes jobs and sends emails. Instead, I built a **multi-agent orchestration system** - because that's what Leena builds.

I studied your product. Leena's AI Colleagues are specialized agents - each with a distinct role - coordinated by an orchestrator, sharing a central knowledge base, with deep enterprise integrations. So I built the same pattern: seven agents, each with configurable capabilities, a shared SQLite memory system, and nine live integrations. The architecture isn't just functional - it's a deliberate mirror of your product.

Why does that matter? Because my background is in **operationalizing complex systems**. At BCG, I designed operating models for Fortune 500 companies. At Mixpanel, I built the GTM operations stack from the ground up - pipeline analytics, pricing strategy, cross-functional planning. What I do is take a strategic vision and turn it into a system that runs.

This tool is that skill applied to AI. It's not a demo - I'm actually using it for my job search right now. Let me show you how."

---

## 1. The Dashboard & Architecture (2 min)

**Open Morning Brief (home page).**

*Point to the stats row.* "These are live numbers - jobs discovered, scored, outreached, interviews, and feedback signals. All from real data, nine integrations."

**Click Agents in sidebar.** "Each agent has capabilities that can be toggled on/off at runtime, scheduled background tasks, and a full activity log."

*Click into Scout (Dwight).* Show the tabs: Activity, Capabilities (with toggles), Schedule, Knowledge.

---

## 2. Live Data - Scan & Score (3 min)

**Go back to Morning Brief. Click 'Scan for Jobs'.**

"Scout searches JSearch and Adzuna APIs in real-time - these are live listings from LinkedIn, Indeed, Glassdoor. The hard filter rejects anything that doesn't match Director+, GTM/Strategy Ops, NYC/Bay Area, B2B SaaS, $300K+ base. Only jobs passing all five gates enter the system."

*Wait for scan to complete.* "Now click 'Score Unscored Jobs'."

"Analyst sends each job to Claude with a structured rubric - 9 dimensions, weighted by my preferences. The composite score is computed from per-dimension scores multiplied by Thompson Sampling weights, not Claude's self-reported number."

**Switch to Job Feed.** "Every job has its score. Click one to see the full breakdown."

---

## 3. Scoring Deep Dive (2 min)

*Click a high-scoring job to open the dossier.*

"Here's the full picture: job description, salary, and a radar chart showing how it scores across all 9 dimensions. The table below shows the score and Claude's reasoning for each dimension - it's transparent, not a black box."

*Point to the score breakdown table.* "Title/Seniority: 5/5 because it's a Head of role. AI-Native: 4/5 because the company uses AI but it's not their core product. Every score has a reason."

---

## 4. Actions - Email Drafts (3 min)

*Show the thumbs up/down buttons on the feed.*

"I can give feedback directly from the feed. Thumbs down removes the job and updates the scoring weights via Thompson Sampling. Thumbs up boosts the score to 70+ and queues it for outreach."

*Click thumbs up on a lower-scored job.* "Watch the score update."

**Open Gmail Drafts tab.** "For every job scoring 70+, the system researches the hiring contact using Claude, creates a personalized outreach email with my resume attached, and saves it as a Gmail draft. The To field is pre-filled - careers@openai.com, jobs@google.com - and the greeting adapts: 'Dear Recruiting Team' for generic addresses, first names for individuals."

*Open one draft.* "My resume is attached, LinkedIn URL is correct, and the body references specific details about why this role fits my background."

---

## 5. Slack Collaboration (2 min)

**Switch to Slack #job-search channel.**

"The Strategist (Jim) sends me a daily digest - every job over 70, with clickable links to both the dashboard and my Gmail drafts. I review, personalize if needed, and send."

*Show the Slack message with links.* "Each entry has the score, the To address, and two links: one to the dashboard dossier, one to the Gmail draft."

*Show agents responding in the channel.* "Multiple agents respond to messages - Scout finds jobs, Analyst explains scores, Jim drafts emails. They have Office personalities - Dwight says 'FACT:', Oscar says 'Actually...', Stanley just wants to go home."

---

## 6. Pipeline & Preferences (2 min)

**Click Pipeline in sidebar.** "The Kanban tracks jobs through stages: Discovered, Queued, Outreached, Applied, Interviewing, Offer, Passed. The Sankey diagram shows the conversion funnel."

**Click Preferences.** "Thompson Sampling weights are live from the database - not hardcoded. You can see how they've drifted from initial values based on my feedback. The feedback history shows every thumbs up/down with timestamps."

---

## 7. The Meta (1 min)

"Nine live integrations - they asked for three. JSearch, Adzuna, Gmail, Google Sheets, Google Calendar, Apollo, Slack (7 bots), Claude API, and Tavily web search. Real read/write operations: scanning jobs, sending emails, creating calendar events, looking up contacts."

"The system uses Leena's own design patterns: orchestrator coordinating specialized AI colleagues, shared memory, runtime-configurable capabilities, and autonomous workflows with human-in-the-loop approval."

"52 passing tests, TDD with pre-push hooks, full prompting history in FULL_CHAT_HISTORY.md. Built entirely with Claude Code."

"Build something you'd actually use. I'm actually using it."

---

## Checklist

- [ ] Live data scan (JSearch + Adzuna, not mock)
- [ ] Job scored live with 9-dimension breakdown visible
- [ ] Thumbs up/down feedback updating scores
- [ ] Email draft with resume attached shown in Gmail
- [ ] Slack digest with clickable links
- [ ] Agent capabilities toggled on/off
- [ ] Pipeline Kanban with real data
- [ ] Thompson Sampling weights shown drifting
- [ ] 9 live integrations (they asked for 3)
