"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingUp, TrendingDown, Loader2, ThumbsUp, ThumbsDown } from "lucide-react";

interface WeightData {
  dimension: string;
  weight: number;
  initial: number;
  alpha: number;
  beta: number;
}

interface FeedbackEntry {
  id: number;
  jobId: number;
  type: string;
  comment: string | null;
  createdAt: string;
}

const DIMENSION_LABELS: Record<string, string> = {
  title_seniority: "Title & Seniority",
  function_alignment: "Function Alignment",
  company_stage: "Company Stage",
  ai_native: "AI-Native Culture",
  location: "Location",
  reporting_line: "Reporting Line",
  comp_signal: "Compensation",
  industry: "Industry (B2B SaaS)",
  growth_trajectory: "Growth Trajectory",
};

const INITIAL_WEIGHTS: Record<string, number> = {
  title_seniority: 0.20, function_alignment: 0.20, company_stage: 0.15,
  ai_native: 0.12, location: 0.10, reporting_line: 0.08,
  comp_signal: 0.08, industry: 0.05, growth_trajectory: 0.02,
};

export default function PreferencesPage() {
  const [weights, setWeights] = useState<WeightData[]>([]);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPreferences = useCallback(async () => {
    try {
      const res = await fetch("/api/preferences");
      const data = await res.json();
      if (data.preferences && data.preferences.length > 0) {
        setWeights(data.preferences.map((p: { dimension: string; effectiveWeight: number; alpha: number; betaParam: number; beta_param?: number }) => ({
          dimension: p.dimension,
          weight: p.effectiveWeight,
          initial: INITIAL_WEIGHTS[p.dimension] || 0.1,
          alpha: p.alpha,
          beta: p.betaParam ?? p.beta_param ?? 2,
        })));
      } else {
        // Fallback to initial weights if no DB data yet
        setWeights(Object.entries(INITIAL_WEIGHTS).map(([dim, w]) => ({
          dimension: dim, weight: w, initial: w, alpha: 2, beta: 2,
        })));
      }
      setFeedbackCount(data.feedbackCount || 0);
      // Fetch feedback history
      try {
        const fbRes = await fetch("/api/feedback");
        const fbData = await fbRes.json();
        setFeedbackHistory(fbData.feedback || []);
      } catch { /* */ }
    } catch {
      // Fallback
      setWeights(Object.entries(INITIAL_WEIGHTS).map(([dim, w]) => ({
        dimension: dim, weight: w, initial: w, alpha: 2, beta: 2,
      })));
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    fetchPreferences().finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [fetchPreferences]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-dim" />
      </div>
    );
  }

  const sorted = [...weights].sort((a, b) => b.weight - a.weight);

  return (
    <div className="space-y-6">
      <h2 className="text-sm font-semibold text-loud">Preferences & Learning</h2>

      <Card className="bg-background border border-border">
        <CardHeader>
          <CardTitle className="text-sm text-loud">Scoring Weights (Thompson Sampling)</CardTitle>
          <p className="text-xs text-muted-foreground">Weights shift based on your feedback. After ~30 signals, the model converges on your true preferences.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {sorted.map((w) => {
            const drift = w.weight - w.initial;
            const driftPercent = w.initial > 0 ? ((drift / w.initial) * 100).toFixed(0) : "0";
            const label = DIMENSION_LABELS[w.dimension] || w.dimension;
            return (
              <div key={w.dimension} className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground w-44 truncate">{label}</span>
                <div className="flex-1 h-2 rounded-full bg-elevated overflow-hidden">
                  <div
                    className="h-full rounded-full bg-rose transition-all"
                    style={{ width: `${w.weight * 100 * 4}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-loud w-12 text-right">
                  {(w.weight * 100).toFixed(0)}%
                </span>
                <div className="w-16 flex items-center gap-1">
                  {drift > 0.005 ? (
                    <TrendingUp className="h-3 w-3 text-emerald-600" />
                  ) : drift < -0.005 ? (
                    <TrendingDown className="h-3 w-3 text-destructive" />
                  ) : null}
                  <span className={`text-[10px] font-mono ${drift > 0.005 ? "text-emerald-600" : drift < -0.005 ? "text-destructive" : "text-dim"}`}>
                    {drift > 0 ? "+" : ""}{driftPercent}%
                  </span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="bg-background border border-border">
          <CardHeader>
            <CardTitle className="text-sm text-loud">Feedback Signals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <p className="text-3xl font-bold text-loud font-mono">{feedbackCount}</p>
              <p className="text-xs text-muted-foreground mt-1">of ~30 needed to converge</p>
              <div className="w-full h-2 rounded-full bg-elevated mt-3 overflow-hidden">
                <div className="h-full rounded-full bg-rose transition-all" style={{ width: `${Math.min((feedbackCount / 30) * 100, 100)}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background border border-border">
          <CardHeader>
            <CardTitle className="text-sm text-loud">Hard Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">Jobs must pass these gates before scoring:</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                "Director+ seniority (in title)",
                "GTM Ops / Strategy Ops / CoS",
                "NYC or Bay Area or Remote",
                "B2B / SaaS / Tech / AI",
                "Meets salary target (configurable)",
              ].map((item) => (
                <Badge key={item} variant="outline" className="text-[10px]">
                  {item}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feedback History */}
      <Card className="bg-background border border-border">
        <CardHeader>
          <CardTitle className="text-sm text-loud">Feedback History</CardTitle>
          <p className="text-xs text-muted-foreground">Your thumbs up/down signals that train the scoring weights.</p>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[250px]">
            {feedbackHistory.length > 0 ? (
              <div className="space-y-1">
                {feedbackHistory.map((fb) => (
                  <div key={fb.id} className="flex items-start gap-3 rounded-lg p-2.5 hover:bg-elevated transition-colors">
                    {fb.type === "thumbs_up" ? (
                      <ThumbsUp className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    ) : (
                      <ThumbsDown className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground">
                        Job #{fb.jobId} — <span className={fb.type === "thumbs_up" ? "text-emerald-600" : "text-destructive"}>{fb.type.replace("_", " ")}</span>
                      </p>
                      {fb.comment && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">&quot;{fb.comment}&quot;</p>
                      )}
                      <p className="text-[10px] text-dim mt-0.5 font-mono">
                        {new Date(fb.createdAt).toLocaleString("en-US", {
                          timeZone: "America/New_York", month: "short", day: "numeric",
                          hour: "numeric", minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-8">
                No feedback yet. Use thumbs up/down on jobs in the feed to train the model.
              </p>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
