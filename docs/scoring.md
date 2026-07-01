# Scoring Methodology

Job Search OS scores every opportunity with a two-pass engine and then learns
your preferences over time. Everything below is driven by configurable weights
and criteria — the examples are illustrative defaults you can tune to your own
search.

## Two-Pass Architecture

**Pass 1 — Hard Filter (instant, no LLM):** Jobs are gated on a handful of
binary criteria before reaching the scorer, so obvious non-matches never cost
an API call. Seniority keywords (Director, VP, Head of, Chief of Staff) must
appear in the job *title* — not the description — to avoid false positives from
listings that merely mention "reports to the Director." Function must match a
target area (GTM Ops, Strategy Ops, Biz Ops, CoS). Location must match your
target markets or remote. Company must be the right type (B2B / SaaS / tech).
An optional salary floor (`MIN_SALARY_FLOOR`, disabled by default) rejects
listings below a threshold when a salary is published. Jobs failing any gate
are rejected during the scan and never enter the database.

**Pass 2 — Deep Score (Claude API):** Surviving jobs are sent to Claude with a
structured prompt requesting JSON scores across 9 weighted dimensions:

| Dimension | Starting Weight | Signal |
|-----------|----------------|--------|
| Title/Seniority | 20% | Director+ trajectory match |
| Function Alignment | 20% | GTM Ops, Strategy Ops, CoS — core fit |
| Company Stage | 15% | Series B–D, post-PMF — where operators create most leverage |
| AI-Native Culture | 12% | AI product, AI tooling in the JD |
| Location | 10% | Target markets, Bay Area, or remote |
| Reporting Line | 8% | CEO/CRO/COO reports = strategic impact |
| Comp Signal | 8% | Meets your configured compensation target |
| Industry | 5% | B2B SaaS preference, flexible on adjacent |
| Growth Trajectory | 2% | Recent fundraise, headcount growth |

The composite score (0–100) is computed as a weighted sum of per-dimension
scores, normalized by preference weights — **not** by the model's self-reported
overall number, which proved unreliable in practice.

## Preference Learning

Weights aren't static. The system uses **Thompson Sampling** — a Bayesian
multi-armed bandit — to learn from your feedback. Each dimension is modeled as
a Beta(2,2) prior. A thumbs-up on a job increases alpha for that job's
high-scoring dimensions; a thumbs-down increases beta. Thumbs-up also boosts
the job's composite score to a 70 minimum, making it eligible for outreach
drafts. Thumbs-down moves the job to "passed" and removes it from the active
feed. After ~30 feedback signals, the model converges on your true preferences.
The Preferences page visualizes weight drift over time.

## What the Rubric Deliberately Excludes

**Company prestige / brand.** Optimizing for logos leads to misaligned
searches. A Series C with strong product-market fit and a Chief of Staff
opening can be more valuable than a household name with a generic ops role.

**Years of experience.** JD "requirements" are wishlists. A candidate's track
record is the signal, not tenure — so the rubric weights demonstrated scope and
fit over stated year counts.

**Exact keyword matching.** LLM-based scoring evaluates semantic fit.
"Chief of Staff" and "Director, Strategy & Operations" serve similar functions
but share few literal keywords; the scorer understands the overlap.
