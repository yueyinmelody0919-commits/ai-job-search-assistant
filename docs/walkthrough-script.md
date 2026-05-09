# Flow Walkthrough Script (10-15 minutes)

## Setup
- Dashboard open at `app.wildkittens.com` (or localhost:3000)
- Slack workspace open with all 7 agents visible
- Two browser tabs: dashboard + a real job listing for reference

---

## Act 1: The Architecture (2 min)

**Open the Agents view.**

"This is a multi-agent system — seven AI colleagues, each with a distinct role, collaborating via Slack and a shared memory system. The architecture mirrors Leena's own AI Colleague pattern: a central orchestrator coordinating specialized agents with deep integrations."

*Point to the React Flow diagram.* "Scout finds jobs, Analyst scores them, Strategist drafts outreach, Ops manages the pipeline. Engineer improves the platform, Coach handles L&D, QA handles bugs. They all share a central SQLite memory system."

"Each agent has a personality from The Office — Dwight is Scout, Oscar is Analyst, Jim is Strategist, Angela is Ops. They send memes."

---

## Act 2: Live Data Discovery (3 min)

**Switch to Slack.** DM Scout (Dwight):

> "Find me CoS roles at Series C+ companies in NYC"

*Wait for Dwight's response.* "Scout searches JSearch and Adzuna APIs in real-time — these are live listings from LinkedIn, Indeed, and Glassdoor. No mock data."

**Switch to Dashboard → Job Feed.**

"Here are the discovered jobs, each scored against my 9-dimension rubric. Click one to see the Company Dossier."

*Click a high-scoring job.* "The radar chart shows where this job scores across all dimensions. The AI provides a fit recommendation. Every score has reasoning — transparent, not a black box."

---

## Act 3: Scoring in Action (3 min)

**DM Analyst (Oscar):**

> "Why did this Figma role score 94?"

*Oscar explains the breakdown with his signature condescension.* "Thompson Sampling means these weights aren't static — they learn from my feedback."

**Click 'More Like This' on a job.** "Each thumbs-up updates the Beta distribution posteriors. After about 30 signals, the model converges. Here—" *switch to Preferences view* "—you can see how weights have drifted from their starting values."

---

## Act 4: Real Actions (3 min)

**Click 'Draft Outreach Email' on a high-scoring job.**

"Strategist — Jim — drafts a personalized email referencing my specific experience that matches this role. This isn't a template."

*Show the generated email.* "I can edit inline, then hit Send — it goes via Gmail API to a real inbox."

**Click 'Schedule Follow-up'.** "This creates a Google Calendar event with reminders. If no reply in 5 days, Angela sends me a notification."

*Switch to Pipeline view.* "The Kanban tracks everything. The Sankey diagram shows my conversion funnel — how many jobs flow from discovery to offer."

---

## Act 5: The Slack Collaboration (2 min)

**Open the #job-search channel.**

"Watch the agents collaborate. Scout found jobs, tagged Analyst to score them, Analyst tagged Strategist to draft outreach. They coordinate autonomously — I just approve."

*Show a meme exchange.* "They also have personality. Jim pranks Dwight. Angela judges everyone. Stanley just wants to go home."

**DM Engineer (Darryl):**

> "Add reviewer@leena.ai to the whitelist"

"Darryl manages dashboard access. He also suggests new features based on what he observes."

---

## Act 6: The Meta (1 min)

"This entire system was built using Claude Code in under two days. The codebase has 52+ passing tests, TDD with pre-push hooks, auto-push on commit, and comprehensive documentation."

"The architecture — orchestrator, specialized agents, shared memory, deep integrations — is the same pattern Leena uses for AI Colleagues. I didn't just build a tool. I built a miniature version of your product, for my own use case."

"Build something you'd actually use. That's the whole brief."

---

## Key Points to Hit

- [ ] 9 live integrations (they asked for 3)
- [ ] Real data from JSearch + Adzuna (not mock)
- [ ] Thompson Sampling preference learning (real ML technique)
- [ ] At least one action firing live (email send or calendar event)
- [ ] Multi-agent Slack collaboration
- [ ] Auto vs Manual mode toggle
- [ ] The Office personalities (memorable, fun)
- [ ] Built with Claude Code (AI-native development)
