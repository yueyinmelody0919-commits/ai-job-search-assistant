# Scoring Methodology

## Two-Pass Architecture

**Pass 1 - Hard Filter (instant, no LLM):** Jobs are gated on five criteria before reaching the scorer. Seniority keywords (Director, VP, Head of, Chief of Staff) must appear in the job *title* - not the description - to avoid false positives. Function must match GTM Ops, Strategy Ops, Biz Ops, or CoS. Location must include NYC, Bay Area, or Remote. Company must be B2B/SaaS/tech. If a salary is listed, it must be $300K+ base. Jobs failing any gate are rejected during the scan and never enter the database.

**Pass 2 - LLM Deep Score (Claude API):** Surviving jobs are sent to Claude with a structured prompt requesting JSON scores across 9 weighted dimensions:

| Dimension | Starting Weight | Signal |
|-----------|----------------|--------|
| Title/Seniority | 20% | Director+ trajectory match |
| Function Alignment | 20% | GTM Ops, Strategy Ops, CoS - core fit |
| Company Stage | 15% | Series B-D, post-PMF - where S&O creates most leverage |
| AI-Native Culture | 12% | AI product, AI tools in JD - my differentiator |
| Location | 10% | NYC primary, Bay Area open |
| Reporting Line | 8% | CEO/CRO/COO reports = strategic impact |
| Comp Signal | 8% | $350K+ base market-rate filter |
| Industry | 5% | B2B SaaS preference, flexible on adjacent |
| Growth Trajectory | 2% | Recent fundraise, headcount growth |

The composite score (0-100) is computed as a weighted sum of per-dimension scores, normalized by preference weights - not by Claude's self-reported overall.

## Preference Learning

Weights aren't static. The system uses **Thompson Sampling** - a Bayesian technique used by LinkedIn's job recommender - to learn from feedback. Each dimension is modeled as a Beta(2,2) prior. Thumbs-up on a job increases alpha for that job's high-scoring dimensions; thumbs-down increases beta. Thumbs-up also boosts the job's composite score to a 70 minimum, making it eligible for outreach drafts. Thumbs-down moves the job to "passed" and removes it from the active feed. After ~30 feedback signals, the model converges on true preferences. The Preferences page shows weight drift over time.

## What I Excluded

**Company prestige/brand.** Optimizing for logos leads to misaligned searches. A Series C with strong PMF and a CoS opening is more valuable than a FAANG with a generic Ops role.

**Years of experience.** JD "requirements" are wishlists. My background (BCG + Mixpanel + Wharton) is the signal, not tenure.

**Exact keyword matching.** LLM-based scoring evaluates semantic fit. "Chief of Staff" and "Director, Strategy & Operations" serve similar functions but share few keywords.
