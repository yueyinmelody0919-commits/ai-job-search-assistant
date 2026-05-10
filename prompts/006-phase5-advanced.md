# Prompt 006 — Phase 5: Advanced Features + Bot Token Setup
**Date**: 2026-05-09  
**Phase**: Phase 5 (Advanced)

---

<details>
<summary><strong>User Prompt (verbatim)</strong></summary>

> keep building phase 5, let me know if you need anything else for it. I will add the bot tokens in the meantime

</details>

<details>
<summary><strong>Work Performed</strong></summary>

### Dashboard Enhancements
- Agent Orchestration view with React Flow (animated nodes, data flow edges)
- Pipeline Sankey diagram (Nivo) showing Discovered→Offer flow
- Score Radar chart (Nivo) in Company Dossier — 9-axis breakdown
- Network Map with Apollo.io company lookup

### New API Routes
- `GET/POST /api/network` — Apollo contact lookup + company enrichment
- `GET/POST /api/agents` — Agent status, activity, periodic web research
- `GET/POST/DELETE /api/whitelist` — Dashboard access managed via Darryl

### Bot Token Guidance
- Explained Bot Token (OAuth & Permissions → xoxb-) vs App Token (Basic Info → xapp-)
- User successfully added all 14 tokens to .env

</details>
