# Prompt 008 — Multi-Bot Responses, Proactive Updates, Outreach
**Date**: 2026-05-09  
**Phase**: Phase 6 (Polish)

---

<details>
<summary><strong>User Prompt (verbatim)</strong></summary>

> also, have them just reply in the channel and feel free to have multiple bots reply if it is relevant to them, or ask follow up questions that I can reply to. keep messages shorter and include urls to relevant, useful sources. Also, the bots shouldn't have to wait for me, if there are updates or changes for me (have a job to do a quick check twice a day) they can just reach out to me with updates. also, we can use this space to begin workshoping my email outbound messages, and then have additional features in the dashboard to show what types of messages I'll be sending, more info on who is actually receiving these (so that can be customized with enriched data about the match). ensure that all updates are propagating to the dashboard so that chatting in the slack / automated / scheduled work by bots will result in updates to what is happening in my pipeline. in this way, I can rely on the slack and then sometimes check the dashboard. bots should be able to send deep links to the dashboard too when we are discussing specific things relevant to that. ensure all of this is documented and working.

</details>

<details>
<summary><strong>Work Performed</strong></summary>

### Multi-Bot Slack Responses
- Multiple agents now respond to the same message when relevant
- Routing: jobs → Scout + Analyst, email → Strategist + Ops, pipeline → Ops + Analyst
- 1.5s delay between multi-bot replies for natural feel

### Proactive Updates
- Scheduled job scan + scoring every 12 hours
- Angela checks follow-up status and posts pipeline updates
- First proactive run 30s after startup

### Deep Links
- All bot responses include clickable dashboard URLs
- Links contextualized per agent (Scout → Job Feed, Angela → Pipeline, etc.)

### Outreach API
- `GET/POST /api/outreach` — outreach activity with enriched recipient data
- Auto-enrichment via Apollo (finds contacts at target company)
- Pipeline stage auto-updates on email send
- All Slack activity logged to SQLite → visible in dashboard

</details>
