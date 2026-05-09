# Scoring Methodology

## How Jobs Are Scored

Jobs pass through a **two-pass scoring architecture** designed to minimize API costs while maximizing evaluation quality.

**Pass 1 (Hard Filter)** applies instant binary gates — no LLM needed. Jobs must match on seniority (Director+), function (GTM/Strategy/Biz Ops/CoS), location (NYC, Bay Area, or Remote), and company type (B2B SaaS/tech). Jobs failing any gate are auto-archived. This eliminates ~70% of listings before they reach the LLM.

**Pass 2 (Deep Score)** sends surviving jobs to Claude with a structured rubric requesting JSON output across 9 weighted dimensions:

| Dimension | Weight | Why It Matters |
|-----------|--------|----------------|
| Title/Seniority | 20% | Must match Director+ trajectory |
| Function Alignment | 20% | GTM Ops, Strategy Ops, Biz Ops, CoS — core fit |
| Company Stage | 15% | Series B-D is where S&O creates most leverage |
| AI-Native Culture | 12% | Differentiator — I bring AI-first execution |
| Location | 10% | NYC primary, Bay Area open |
| Reporting Line | 8% | CEO/CRO reports = higher strategic impact |
| Comp Signal | 8% | $350K+ base as market-rate filter |
| Industry | 5% | B2B SaaS preference, flexible on adjacent |
| Growth Trajectory | 2% | Recent fundraise/hiring as momentum signal |

## Preference Learning

Static weights are a starting point. The system uses **Thompson Sampling** — a Bayesian multi-armed bandit technique used by LinkedIn's job recommender and DoorDash's ranking — to learn from my feedback. Each dimension is modeled as a Beta distribution. Thumbs-up/down on scored jobs shifts the posterior, and new scores are sampled from updated distributions. After ~30 feedback signals, the model converges on true preferences. The dashboard shows weight drift over time.

## What I Excluded (and Why)

**Company brand/prestige**: Optimizing for logos leads to misaligned searches. A Series C company with strong product-market fit and a CoS opening is more valuable than a brand-name FAANG with a generic Ops role.

**Years of experience requirements**: JD "requirements" are wishlists. A Director role asking for "15+ years" is still relevant if the scope matches — my background (BCG + Mixpanel + Wharton) is the signal, not tenure.

**Exact keyword matching**: LLM-based scoring evaluates semantic fit, not keyword overlap. "Chief of Staff" and "Director, Strategy & Operations" serve similar functions but share few keywords.
