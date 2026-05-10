# Prompt 003 — Full System Design: Office Personas + TDD + Hosting
**Date**: 2026-05-09  
**Phase**: Planning → Execution

---

<details>
<summary><strong>User Prompt (verbatim)</strong></summary>

> This all sounds good, I'll get you the API tokens you need and add them to the .env in a moment, you can go ahead and create the .env.example and I'll use that as a reference. I want you to also create an engineer AI colleage that thinks up and adds new features that will improve the overall platform on my behalf without me having to suggest things just as we go. I should be able to chat with this colleague via slack and then they build up a profile of what might be good ideas to improve the platform just via that. also, the different collegues should periodically trigger web searches based on their relevant needs to get up to date info about what might be relevant to their different objectives. e.g. how is the field changing? what are other tools / projects like mine doing that might be relevant feature ideas? let's store and organize in an effective way all of this data + all of my feedback (ensuring freshness of data via whatever methods make sense). I want the different collegues to have their specializations but be able to share info via this central memory system. also, let's create an L&D coach for me that works with the others to help me learn new skills relevant to everything else that is going on. Just for fun, give all of the collegues different personalities based on the TV show the office. to complete the effect, ensure that they have images in their profiles and sometimes send sassy memes to each other / me. finally, I want you to build ALL of this following the best practices of test driven design, use hooks to ensure that all of your code is passing test before pusing. have an AI collegue that does Q&A and whom I can complain to about things that break. I want you to have all of this hosted online, we can use an enpoint on my wildkittens.com website. Add verification via google auth and only whitelist people who I approve via slack in communication with the engineer collegue. keep logs of everything you do for your own references in case we need to investigate issues, after the basics are in place here we'll discuss more about how to craft nice sounding emails and stratgies for that. write out the full plan about everything we have discussed as a next step, in it you should highligh my next steps. I'll review it and then say execute. As always, document everything you do as readme docs so that this codebase is totally accessible following best practices.

</details>

<details>
<summary><strong>New Requirements Introduced</strong></summary>

### New Agents
- Engineer (Darryl Philbin) — self-directed feature ideation, whitelist management
- L&D Coach (Holly Flax) — skill recommendations, learning plans
- QA (Stanley Hudson) — bug complaints, test monitoring

### System Features
- The Office personalities with memes and inter-agent banter
- Central memory system (SQLite) with freshness management
- Periodic web searches by each agent for their domain
- TDD with Husky hooks (pre-commit, pre-push, post-commit auto-push)
- Hosting on wildkittens.com via Vercel + Railway
- Google Auth with Slack-managed whitelist
- Comprehensive logging and documentation

</details>

<details>
<summary><strong>Work Performed</strong></summary>

- Created full execution plan (6 phases, 43 steps)
- Wrote plan file at `.claude/plans/composed-crunching-treehouse.md`
- Identified user action items (API signups, Slack workspace, DNS)

</details>
