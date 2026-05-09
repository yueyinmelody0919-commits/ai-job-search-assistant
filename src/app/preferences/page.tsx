"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, TrendingDown } from "lucide-react";

const weights = [
  { dimension: "Title & Seniority", weight: 0.22, initial: 0.20, alpha: 4.2, beta: 2.1 },
  { dimension: "Function Alignment", weight: 0.19, initial: 0.20, alpha: 3.8, beta: 2.3 },
  { dimension: "Company Stage", weight: 0.16, initial: 0.15, alpha: 3.5, beta: 2.0 },
  { dimension: "AI-Native Culture", weight: 0.14, initial: 0.12, alpha: 4.0, beta: 2.5 },
  { dimension: "Location", weight: 0.09, initial: 0.10, alpha: 2.5, beta: 2.8 },
  { dimension: "Reporting Line", weight: 0.08, initial: 0.08, alpha: 2.3, beta: 2.0 },
  { dimension: "Compensation ($350K+)", weight: 0.06, initial: 0.08, alpha: 2.0, beta: 3.1 },
  { dimension: "Industry (B2B SaaS)", weight: 0.04, initial: 0.05, alpha: 2.1, beta: 2.5 },
  { dimension: "Growth Trajectory", weight: 0.02, initial: 0.02, alpha: 2.0, beta: 2.0 },
];

export default function PreferencesPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-white">Preferences & Learning</h2>

      <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-base text-white">Scoring Weights (Thompson Sampling)</CardTitle>
          <p className="text-xs text-white/40">Weights shift based on your feedback. After ~30 signals, the model converges on your true preferences.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {weights.map((w) => {
            const drift = w.weight - w.initial;
            const driftPercent = ((drift / w.initial) * 100).toFixed(0);
            return (
              <div key={w.dimension} className="flex items-center gap-4">
                <span className="text-xs text-white/60 w-44 truncate">{w.dimension}</span>
                <div className="flex-1 h-3 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                    style={{ width: `${w.weight * 100 * 4}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-white/50 w-12 text-right">
                  {(w.weight * 100).toFixed(0)}%
                </span>
                <div className="w-16 flex items-center gap-1">
                  {drift > 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-400" />
                  ) : drift < 0 ? (
                    <TrendingDown className="h-3 w-3 text-red-400" />
                  ) : null}
                  <span className={`text-[10px] ${drift > 0 ? "text-green-400" : drift < 0 ? "text-red-400" : "text-white/30"}`}>
                    {drift > 0 ? "+" : ""}{driftPercent}%
                  </span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-sm text-white">Feedback Signals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <p className="text-3xl font-bold text-white">12</p>
              <p className="text-xs text-white/40 mt-1">of ~30 needed to converge</p>
              <div className="w-full h-2 rounded-full bg-white/10 mt-3 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-green-500" style={{ width: "40%" }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-sm text-white">Excluded</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-white/50">Companies and criteria excluded from scoring:</p>
            <div className="flex flex-wrap gap-1">
              {["Company prestige/brand", "Pre-seed startups", "Non-tech industries", "< 50 employees"].map((item) => (
                <Badge key={item} variant="outline" className="text-[10px] border-white/10 text-white/40">
                  {item}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
