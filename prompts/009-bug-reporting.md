# Prompt 009 — Bug Reporting System + Agent Capabilities
**Date**: 2026-05-09  
**Phase**: Phase 6 (Polish)

---

<details>
<summary><strong>User Prompt (verbatim)</strong></summary>

> I want the agents to be aware of what their capabilities are and, when they can't fix something or an error becomes apparent, they simple save it to a db or file and let me know that they've logged a bug report. bugs then gets displayed on the dashboard showing bugs, their status, etc. each bug should also include a claude focused prompt that can be given to you so that you can make the fix. there should be a simple button to just copy a nicely concatenated version of all of these, then I can just paste that here. While I want the agents to be sassy, the acutal prompts should be clean and focused on fixing the issues. make this fix

</details>

<details>
<summary><strong>Work Performed</strong></summary>

### Bug Reporting System
- New `bugs` table in SQLite (title, description, severity, error, stack trace, context, fix prompt)
- `BaseAgent.reportBug()` — any agent can file bugs when it hits errors
- Auto-generated Claude-focused fix prompts (clean, actionable, step-by-step)
- Agent capability awareness injected into system prompts

### Dashboard (/bugs)
- Bug list grouped by status (open, in progress, fixed, won't fix)
- Severity badges, expandable detail view
- "Copy Fix Prompt" per bug — copies Claude-ready prompt
- "Copy All Fix Prompts" — concatenates all open bugs into one prompt
- Status management buttons (in progress, fixed, won't fix)

### Slack Integration
- On agent error, Stanley (QA) posts with bug link to dashboard
- Bug auto-filed with full context (user message, channel, error)

### Navigation
- Added Bugs page to sidebar

</details>
