# Build Log

This document captures the key decisions, prompts, and milestones during the construction of Melody's AI Colleague Team.

## Timeline

### 2026-05-09 — Project Kickoff

**Context**: Interview assignment for Leena AI Director of Strategy & Operations role. Assignment: Build a Job Search Assistant using Claude.ai with 3+ live external systems, scoring, actions, and a dashboard.

**Key Decision: Mirror Leena's Architecture**
After researching Leena AI's product (AI Colleague Studio, Master Orchestrator pattern, autonomous AI colleagues), we decided to build a multi-agent system that mirrors their product philosophy. This is the strategic differentiator — the tool demonstrates understanding of what Leena builds, not just technical execution.

**Key Decision: The Office Personalities**
Each AI colleague gets a distinct personality based on The Office characters. This makes the demo memorable and fun, and shows creativity beyond pure engineering.

**Key Decision: Thompson Sampling for Preference Learning**
Instead of static weighted scoring, we implemented Thompson Sampling (the same technique used by LinkedIn's job recommender and DoorDash's ranking system). Each scoring dimension is modeled as a Beta distribution that updates based on user feedback. This is a real ML technique that demonstrates analytical sophistication.

**Key Decision: 9 Integrations (3x the requirement)**
The assignment requires 3 live external systems. We're connecting 9: JSearch, Adzuna, Gmail, Google Sheets, Google Calendar, Apollo.io, Slack (7 bots), Claude API, and Tavily web search.

**Key Decision: TDD with Git Hooks**
All code follows test-driven development. Husky pre-push hooks block pushes if tests fail. Post-commit hooks auto-push to GitHub.

### Phase 1: Foundation
- Initialized Next.js 16 with TypeScript, Tailwind CSS, shadcn/ui
- Set up SQLite via Drizzle ORM with full schema (12 tables)
- Implemented Thompson Sampling scoring engine with 24 passing tests
- Configured Husky hooks (pre-commit: typecheck+lint, pre-push: tests, post-commit: auto-push)
- Created GitHub repo with initial commit

---

*This log is updated as the project progresses. Claude Code conversation exports are saved in `/prompts/`.*
