# Prompt 007 — Wire Dashboard to Real Data + Google OAuth
**Date**: 2026-05-09  
**Phase**: Phase 6 (Polish)

---

<details>
<summary><strong>User Prompt (verbatim)</strong></summary>

> let's get everything working well locally first, that's fine for now actually. I can set this up on remote after we have finalized the dashboard and slack. what is left to do to have the dashboard show real data? what is left to finalize for email integration to work and calendar integration to work? I bascially want to have this show accurate info, it looks like I am seeing dummy data atm. also, autopilot needs to be able to actually draft up emails and send them. focus on that, core functionality not gimmicky features.

</details>

<details>
<summary><strong>Work Performed</strong></summary>

### Database Setup
- Pushed Drizzle schema to SQLite (`npx drizzle-kit push`)
- Seeded 9 scoring dimensions (Beta(2,2) priors)
- Seeded whitelist with Melody's email

### Dashboard → Real Data
- Morning Brief: real stats from `/api/pipeline`, working Scan + Score buttons, live agent logs
- Job Feed: real jobs from SQLite, working email drafts via Claude API, working feedback
- Pipeline: real kanban from API, live Sankey diagram
- Removed all hardcoded demo arrays

### Google OAuth
- Built OAuth flow via Next.js API routes (`/api/auth/google-setup` + `/api/auth/callback/google`)
- User completed OAuth consent flow, obtained refresh token
- Gmail, Calendar, Sheets integrations now functional

### Slack Bots
- Verified all 7 bots authenticate (7/7 ✓)
- Added `dotenv/config` to Slack entry point (was missing env loading)
- Fixed DMs by adding `message.channels` event subscription via manifest API
- Downloaded and resized 7 Office character headshots for bot profiles

</details>
