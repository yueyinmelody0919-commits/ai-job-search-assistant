"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ScoreRadar } from "@/components/charts/score-radar";
import {
  Search, ThumbsUp, ThumbsDown, Send, CalendarPlus,
  ExternalLink, MapPin, Building2, DollarSign, Users,
  Sparkles, Loader2,
} from "lucide-react";

interface JobEntry {
  job: {
    id: number; title: string; company: string; location: string;
    url: string; description: string; salaryMin: number | null;
    salaryMax: number | null; source: string;
  };
  overallScore: number | null;
  stage: string | null;
}

interface ScoreDetail {
  dimension: string;
  score: number;
  reason: string;
}

function getScoreColor(score: number) {
  if (score >= 90) return "text-green-400 bg-green-500/20 border-green-500/30";
  if (score >= 80) return "text-blue-400 bg-blue-500/20 border-blue-500/30";
  if (score >= 70) return "text-amber-400 bg-amber-500/20 border-amber-500/30";
  return "text-white/40 bg-white/10 border-white/10";
}

function getStageColor(stage: string) {
  const colors: Record<string, string> = {
    discovered: "bg-gray-500/20 text-gray-300 border-gray-500/30",
    queued: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    outreached: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    applied: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    interviewing: "bg-green-500/20 text-green-300 border-green-500/30",
  };
  return colors[stage] || colors.discovered;
}

const dimensionLabels: Record<string, string> = {
  title_seniority: "Title & Seniority", function_alignment: "Function Fit",
  company_stage: "Company Stage", ai_native: "AI-Native Culture",
  location: "Location", reporting_line: "Reporting Line",
  comp_signal: "Compensation", industry: "Industry",
  growth_trajectory: "Growth Trajectory",
};

export default function JobFeed() {
  const [jobs, setJobs] = useState<JobEntry[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobEntry | null>(null);
  const [selectedScores] = useState<ScoreDetail[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [draftingEmail, setDraftingEmail] = useState(false);
  const [draftedEmail, setDraftedEmail] = useState<{ subject: string; body: string } | null>(null);
  const [feedbackComment, setFeedbackComment] = useState("");

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/jobs?limit=50");
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch { /* */ }
  }, []);

  useEffect(() => {
    let mounted = true;
    fetchJobs().finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [fetchJobs]);

  async function openDossier(entry: JobEntry) {
    setSelectedJob(entry);
    setDraftedEmail(null);
    // Fetch score details
    try {
      const res = await fetch(`/api/jobs?limit=1`); // We'll use the score data from the job
      // For now use what we have
    } catch { /* */ }
  }

  async function handleFeedback(jobId: number, type: "thumbs_up" | "thumbs_down", comment?: string) {
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, type, comment: comment || undefined }),
      });
      setFeedbackComment("");
      fetchJobs();
    } catch { /* */ }
  }

  async function draftEmail(jobId: number) {
    setDraftingEmail(true);
    try {
      const res = await fetch("/api/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "draft_email", jobId }),
      });
      const data = await res.json();
      if (data.email) {
        setDraftedEmail(data.email);
      }
    } catch {
      alert("Email drafting failed — check ANTHROPIC_API_KEY");
    }
    setDraftingEmail(false);
  }

  async function scheduleFollowup(jobId: number) {
    try {
      const res = await fetch("/api/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "schedule_followup", jobId }),
      });
      const data = await res.json();
      if (data.event) {
        alert(`Follow-up scheduled for ${selectedJob?.job.company}`);
      } else {
        alert("Calendar integration requires Google refresh token — run: npx tsx scripts/get-google-token.ts");
      }
    } catch {
      alert("Calendar integration requires Google refresh token");
    }
  }

  const filteredJobs = jobs.filter(
    (entry) =>
      entry.job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.job.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <Input placeholder="Search jobs, companies..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-white/10 bg-white/5 text-white placeholder:text-white/30" />
        </div>
        <Badge variant="outline" className="border-white/10 text-white/40 text-xs">
          {filteredJobs.length} jobs
        </Badge>
      </div>

      {/* Job Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-white/30" />
        </div>
      ) : filteredJobs.length === 0 ? (
        <Card className="border-white/10 bg-white/5">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Search className="h-8 w-8 text-white/20 mb-3" />
            <p className="text-sm text-white/40">No jobs found. Go to the Morning Brief and click &quot;Scan for Jobs&quot;.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((entry) => (
            <Card key={entry.job.id}
              className="border-white/10 bg-white/5 backdrop-blur-sm cursor-pointer transition-all hover:bg-white/[0.07] hover:border-white/20"
              onClick={() => openDossier(entry)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${getScoreColor(entry.overallScore || 0)}`}>
                      <span className="text-lg font-bold">{entry.overallScore || "—"}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-white truncate">{entry.job.title}</h3>
                        {entry.stage && (
                          <Badge variant="outline" className={`text-[10px] ${getStageColor(entry.stage)}`}>
                            {entry.stage}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs text-white/50">
                          <Building2 className="h-3 w-3" /> {entry.job.company}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-white/50">
                          <MapPin className="h-3 w-3" /> {entry.job.location || "—"}
                        </span>
                        {entry.job.salaryMin && (
                          <span className="flex items-center gap-1 text-xs text-white/50">
                            <DollarSign className="h-3 w-3" />
                            ${(entry.job.salaryMin / 1000).toFixed(0)}K{entry.job.salaryMax ? ` - $${(entry.job.salaryMax / 1000).toFixed(0)}K` : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" className="h-8 text-green-400/60 hover:text-green-400 hover:bg-green-500/10"
                      onClick={(e) => { e.stopPropagation(); handleFeedback(entry.job.id, "thumbs_up"); }}>
                      <ThumbsUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 text-red-400/40 hover:text-red-400 hover:bg-red-500/10"
                      onClick={(e) => { e.stopPropagation(); handleFeedback(entry.job.id, "thumbs_down"); }}>
                      <ThumbsDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Company Dossier */}
      <Sheet open={!!selectedJob} onOpenChange={(open) => !open && setSelectedJob(null)}>
        <SheetContent className="w-[500px] sm:w-[600px] border-white/10 bg-black/95 backdrop-blur-xl overflow-y-auto">
          {selectedJob && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-xl border ${getScoreColor(selectedJob.overallScore || 0)}`}>
                    <span className="text-2xl font-bold">{selectedJob.overallScore || "—"}</span>
                  </div>
                  <div>
                    <SheetTitle className="text-white text-lg">{selectedJob.job.title}</SheetTitle>
                    <p className="text-sm text-white/60">{selectedJob.job.company} · {selectedJob.job.location}</p>
                  </div>
                </div>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {selectedJob.job.salaryMin && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-400" />
                    <span className="text-sm text-white">
                      ${(selectedJob.job.salaryMin / 1000).toFixed(0)}K{selectedJob.job.salaryMax ? ` - $${(selectedJob.job.salaryMax / 1000).toFixed(0)}K` : ""} base
                    </span>
                  </div>
                )}

                <Separator className="bg-white/10" />

                {/* Actions */}
                <div className="space-y-2">
                  <Button className="w-full justify-start gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => draftEmail(selectedJob.job.id)} disabled={draftingEmail}>
                    {draftingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {draftingEmail ? "Drafting..." : "Draft Outreach Email"}
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2 border-white/10 text-white/70 hover:bg-white/10"
                    onClick={() => scheduleFollowup(selectedJob.job.id)}>
                    <CalendarPlus className="h-4 w-4" /> Schedule Follow-up
                  </Button>
                  {selectedJob.job.url && (
                    <a href={selectedJob.job.url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="w-full justify-start gap-2 border-white/10 text-white/70 hover:bg-white/10">
                        <ExternalLink className="h-4 w-4" /> View Original Listing
                      </Button>
                    </a>
                  )}
                </div>

                {/* Drafted Email */}
                {draftedEmail && (
                  <>
                    <Separator className="bg-white/10" />
                    <div>
                      <h4 className="text-sm font-medium text-white mb-2">Drafted Email</h4>
                      <div className="rounded-lg bg-white/5 border border-white/10 p-4 space-y-2">
                        <p className="text-xs text-white/50">Subject:</p>
                        <p className="text-sm text-white">{draftedEmail.subject}</p>
                        <Separator className="bg-white/10" />
                        <p className="text-xs text-white/50">Body:</p>
                        <p className="text-sm text-white/80 whitespace-pre-wrap">{draftedEmail.body}</p>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={() => alert("Email sending requires Google refresh token. Run: npx tsx scripts/get-google-token.ts")}>
                          <Send className="h-4 w-4 mr-2" /> Send via Gmail
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {/* Feedback */}
                <div className="space-y-2 pt-2">
                  <textarea
                    placeholder="Optional: tell us why (e.g. 'salary too low', 'not a Director role', 'love the AI focus')..."
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30 p-3 h-16 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  />
                  <div className="flex gap-2">
                    <Button className="flex-1 gap-2 bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-500/30"
                      onClick={() => { handleFeedback(selectedJob.job.id, "thumbs_up", feedbackComment); setSelectedJob(null); }}>
                      <ThumbsUp className="h-4 w-4" /> More Like This
                    </Button>
                    <Button className="flex-1 gap-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30"
                      onClick={() => { handleFeedback(selectedJob.job.id, "thumbs_down", feedbackComment); setSelectedJob(null); }}>
                      <ThumbsDown className="h-4 w-4" /> Not For Me
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
