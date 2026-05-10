# Prompt 011 — Agent Context, Docs Access, Permission-Gated Actions
**Date**: 2026-05-09  
**Phase**: Phase 6 (Polish)

---

<details>
<summary><strong>User Prompt (verbatim)</strong></summary>

> the agents should have context (that you ensure is fresh with a hook to check on this if needed as we work) about the different features of dashboard. they should also have access to a log of what has happened as well as be able to search any docs gathered etc. that way if I ask questions I should be able to get intelligent responses and they should be able to take appropriate action on my behalf. before sending emails, they should have to ask for permission. if they have any follow up questions they can ask that too. plan and make any changes needed to get all of this working really well.

</details>

<details>
<summary><strong>Work Performed</strong></summary>

### Agent Context System
- Dashboard feature descriptions injected into agent system prompts
- Recent pipeline/job stats loaded as context before each response
- Agent logs and knowledge base searchable within conversations

### Permission-Gated Actions
- Email sending requires explicit user approval in Slack
- Agents ask follow-up questions when they need clarification
- Confirmation flow before any destructive/external action

### Documentation Access
- Agents can reference docs, knowledge base entries, and agent logs
- Fresh context loaded per response from SQLite

</details>
