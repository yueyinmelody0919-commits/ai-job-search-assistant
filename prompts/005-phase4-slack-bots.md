# Prompt 005 — Phase 4: Slack Bots + API Testing
**Date**: 2026-05-09  
**Phase**: Phase 4 (Slack Agents)

---

<details>
<summary><strong>User Prompt (verbatim)</strong></summary>

> ok, I added the slack team id and access token to .env. I added a bunch of other things there too. get the bots set up and finish phase 4. ensure you are logging everything and testing as you go. if you have not been testing previous parts, go back and have a sub agent test those.

</details>

<details>
<summary><strong>Work Performed</strong></summary>

### Slack Bot Creation
- Created all 7 Slack apps programmatically via `apps.manifest.create` API
- App IDs saved to `data/slack-apps.json`
- Install guide generated at `docs/slack-setup.md`

### Agent Implementation
- Built BaseAgent class with Claude API integration and shared memory
- Implemented 7 personas with full Office character system prompts:
  - Scout (Dwight), Analyst (Oscar), Strategist (Jim), Ops (Angela)
  - Engineer (Darryl), Coach (Holly), QA (Stanley)
- Built AgentRouter (DM routing, @mention routing, keyword-based fallback)
- Built meme engine (curated GIFs + GIPHY API fallback)

### Integration Testing
- Launched sub-agent to smoke test JSearch, Adzuna, Tavily with real API keys
- Results: JSearch ✓ (10 jobs), Adzuna ✓ (fixed bug, 10 jobs), Tavily ✓ (5 results)
- Fixed Adzuna `content_type` query param bug

### Testing
- 52 tests passing (17 new: agent, router, meme tests)

</details>
