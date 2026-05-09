"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ScoreRadar } from "@/components/charts/score-radar";
import {
  Search,
  ThumbsUp,
  ThumbsDown,
  Send,
  CalendarPlus,
  ExternalLink,
  MapPin,
  Building2,
  DollarSign,
  Users,
  Sparkles,
} from "lucide-react";

// Demo data
const demoJobs = [
  {
    id: 1, title: "Director, Strategy & Operations", company: "Figma", location: "New York, NY",
    score: 94, stage: "queued", source: "jsearch", salaryMin: 380000, salaryMax: 450000,
    scores: { title_seniority: 5, function_alignment: 5, company_stage: 5, ai_native: 4, location: 5, reporting_line: 4, comp_signal: 5, industry: 5, growth_trajectory: 4 },
    recommendation: "Exceptional fit. Design-led company with strong AI integration. Reports to COO.",
    description: "Lead strategic and operational initiatives across Figma's GTM organization...",
  },
  {
    id: 2, title: "Head of Business Operations", company: "Notion", location: "San Francisco, CA",
    score: 91, stage: "outreached", source: "jsearch", salaryMin: 360000, salaryMax: 420000,
    scores: { title_seniority: 5, function_alignment: 4, company_stage: 5, ai_native: 5, location: 4, reporting_line: 5, comp_signal: 4, industry: 5, growth_trajectory: 5 },
    recommendation: "Strong fit. AI-native product, reports to CEO. CoS-adjacent scope.",
    description: "Own business operations and strategic planning for Notion's growth phase...",
  },
  {
    id: 3, title: "VP, Revenue Operations", company: "Ramp", location: "New York, NY",
    score: 88, stage: "discovered", source: "adzuna", salaryMin: 350000, salaryMax: 400000,
    scores: { title_seniority: 5, function_alignment: 4, company_stage: 4, ai_native: 3, location: 5, reporting_line: 4, comp_signal: 4, industry: 5, growth_trajectory: 5 },
    recommendation: "Good fit. Fintech-adjacent, strong growth. Less AI-native culture.",
    description: "Lead revenue operations strategy and execution at Ramp...",
  },
  {
    id: 4, title: "Chief of Staff to CEO", company: "Anthropic", location: "San Francisco, CA",
    score: 86, stage: "discovered", source: "jsearch", salaryMin: 400000, salaryMax: 500000,
    scores: { title_seniority: 4, function_alignment: 3, company_stage: 5, ai_native: 5, location: 4, reporting_line: 5, comp_signal: 5, industry: 5, growth_trajectory: 5 },
    recommendation: "Strong company fit, slightly different function (CoS vs Ops). Worth pursuing.",
    description: "Chief of Staff to the CEO at Anthropic, working across strategic initiatives...",
  },
  {
    id: 5, title: "Director, GTM Strategy", company: "Scale AI", location: "New York, NY",
    score: 83, stage: "discovered", source: "adzuna", salaryMin: 340000, salaryMax: 380000,
    scores: { title_seniority: 5, function_alignment: 4, company_stage: 4, ai_native: 5, location: 5, reporting_line: 3, comp_signal: 3, industry: 5, growth_trajectory: 4 },
    recommendation: "Good fit. AI-native company, NYC. Comp slightly below target.",
    description: "Drive GTM strategy for Scale AI's enterprise product line...",
  },
];

function getScoreColor(score: number) {
  if (score >= 90) return "text-green-400 bg-green-500/20 border-green-500/30";
  if (score >= 80) return "text-blue-400 bg-blue-500/20 border-blue-500/30";
  if (score >= 70) return "text-amber-400 bg-amber-500/20 border-amber-500/30";
  return "text-red-400 bg-red-500/20 border-red-500/30";
}

function getStageColor(stage: string) {
  const colors: Record<string, string> = {
    discovered: "bg-gray-500/20 text-gray-300 border-gray-500/30",
    queued: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    outreached: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    applied: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    interviewing: "bg-green-500/20 text-green-300 border-green-500/30",
    offer: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    passed: "bg-red-500/20 text-red-300 border-red-500/30",
  };
  return colors[stage] || colors.discovered;
}

const dimensionLabels: Record<string, string> = {
  title_seniority: "Title & Seniority",
  function_alignment: "Function Fit",
  company_stage: "Company Stage",
  ai_native: "AI-Native Culture",
  location: "Location",
  reporting_line: "Reporting Line",
  comp_signal: "Compensation",
  industry: "Industry",
  growth_trajectory: "Growth Trajectory",
};

export default function JobFeed() {
  const [selectedJob, setSelectedJob] = useState<(typeof demoJobs)[0] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredJobs = demoJobs.filter(
    (job) =>
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <Input
            placeholder="Search jobs, companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-white/10 bg-white/5 text-white placeholder:text-white/30"
          />
        </div>
        <Button variant="outline" size="sm" className="border-white/10 bg-white/5 text-white/60 hover:bg-white/10">
          Score 80+
        </Button>
        <Button variant="outline" size="sm" className="border-white/10 bg-white/5 text-white/60 hover:bg-white/10">
          NYC Only
        </Button>
      </div>

      {/* Job Cards */}
      <div className="space-y-3">
        {filteredJobs.map((job) => (
          <Card
            key={job.id}
            className="border-white/10 bg-white/5 backdrop-blur-sm cursor-pointer transition-all hover:bg-white/[0.07] hover:border-white/20"
            onClick={() => setSelectedJob(job)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${getScoreColor(job.score)}`}>
                    <span className="text-lg font-bold">{job.score}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white">{job.title}</h3>
                      <Badge variant="outline" className={`text-[10px] ${getStageColor(job.stage)}`}>
                        {job.stage}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-white/50">
                        <Building2 className="h-3 w-3" /> {job.company}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-white/50">
                        <MapPin className="h-3 w-3" /> {job.location}
                      </span>
                      {job.salaryMin && (
                        <span className="flex items-center gap-1 text-xs text-white/50">
                          <DollarSign className="h-3 w-3" />
                          ${(job.salaryMin / 1000).toFixed(0)}K - ${(job.salaryMax / 1000).toFixed(0)}K
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/40 mt-1 flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-purple-400" />
                      {job.recommendation}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" className="h-8 text-green-400/60 hover:text-green-400 hover:bg-green-500/10"
                    onClick={(e) => { e.stopPropagation(); }}>
                    <ThumbsUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 text-red-400/40 hover:text-red-400 hover:bg-red-500/10"
                    onClick={(e) => { e.stopPropagation(); }}>
                    <ThumbsDown className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Company Dossier Slide-out */}
      <Sheet open={!!selectedJob} onOpenChange={(open) => !open && setSelectedJob(null)}>
        <SheetContent className="w-[500px] sm:w-[600px] border-white/10 bg-black/95 backdrop-blur-xl overflow-y-auto">
          {selectedJob && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-xl border ${getScoreColor(selectedJob.score)}`}>
                    <span className="text-2xl font-bold">{selectedJob.score}</span>
                  </div>
                  <div>
                    <SheetTitle className="text-white text-lg">{selectedJob.title}</SheetTitle>
                    <p className="text-sm text-white/60">{selectedJob.company} · {selectedJob.location}</p>
                  </div>
                </div>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Radar Chart */}
                <ScoreRadar scores={selectedJob.scores} />

                <Separator className="bg-white/10" />

                {/* Score Breakdown */}
                <div>
                  <h4 className="text-sm font-medium text-white mb-3">Score Breakdown</h4>
                  <div className="space-y-2">
                    {Object.entries(selectedJob.scores).map(([dim, score]) => (
                      <div key={dim} className="flex items-center gap-3">
                        <span className="text-xs text-white/50 w-32 truncate">
                          {dimensionLabels[dim] || dim}
                        </span>
                        <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              score >= 4 ? "bg-green-500" : score >= 3 ? "bg-blue-500" : "bg-amber-500"
                            }`}
                            style={{ width: `${(score / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-white/70 w-6 text-right">
                          {score}/5
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="bg-white/10" />

                {/* AI Recommendation */}
                <div>
                  <h4 className="text-sm font-medium text-white mb-2">AI Analysis</h4>
                  <p className="text-sm text-white/60 bg-white/5 rounded-lg p-3 border border-white/10">
                    {selectedJob.recommendation}
                  </p>
                </div>

                <Separator className="bg-white/10" />

                {/* Salary */}
                {selectedJob.salaryMin && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-400" />
                    <span className="text-sm text-white">
                      ${(selectedJob.salaryMin / 1000).toFixed(0)}K - ${(selectedJob.salaryMax / 1000).toFixed(0)}K base
                    </span>
                  </div>
                )}

                <Separator className="bg-white/10" />

                {/* Actions */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-white mb-3">Actions</h4>
                  <Button className="w-full justify-start gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                    <Send className="h-4 w-4" /> Draft Outreach Email
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2 border-white/10 text-white/70 hover:bg-white/10">
                    <CalendarPlus className="h-4 w-4" /> Schedule Follow-up
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2 border-white/10 text-white/70 hover:bg-white/10">
                    <Users className="h-4 w-4" /> Find People at {selectedJob.company}
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2 border-white/10 text-white/70 hover:bg-white/10">
                    <ExternalLink className="h-4 w-4" /> View Original Listing
                  </Button>
                </div>

                {/* Feedback */}
                <div className="flex gap-2 pt-4">
                  <Button className="flex-1 gap-2 bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-500/30">
                    <ThumbsUp className="h-4 w-4" /> More Like This
                  </Button>
                  <Button className="flex-1 gap-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30">
                    <ThumbsDown className="h-4 w-4" /> Not For Me
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
