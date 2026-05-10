"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScoreRadar } from "@/components/charts/score-radar";
import {
  Search, ThumbsUp, ThumbsDown, Send, CalendarPlus,
  ExternalLink, MapPin, Building2, DollarSign,
  ChevronDown, ChevronUp, Loader2,
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
  if (score >= 90) return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (score >= 80) return "text-blue-700 bg-blue-50 border-blue-200";
  if (score >= 70) return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-muted-foreground bg-surface border-border";
}

function getStageColor(stage: string) {
  const colors: Record<string, string> = {
    discovered: "bg-muted text-muted-foreground border-border",
    queued: "bg-blue-50 text-blue-700 border-blue-200",
    outreached: "bg-violet-50 text-violet-700 border-violet-200",
    applied: "bg-amber-50 text-amber-700 border-amber-200",
    interviewing: "bg-emerald-50 text-emerald-700 border-emerald-200",
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

export default function JobFeedPage() {
  return (
    <Suspense>
      <JobFeed />
    </Suspense>
  );
}

function JobFeed() {
  const [jobs, setJobs] = useState<JobEntry[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobEntry | null>(null);
  const [selectedScores, setSelectedScores] = useState<ScoreDetail[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [draftingEmail, setDraftingEmail] = useState(false);
  const [draftedEmail, setDraftedEmail] = useState<{ subject: string; body: string } | null>(null);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [descExpanded, setDescExpanded] = useState(false);
  const searchParams = useSearchParams();

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/jobs?limit=50");
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch { /* */ }
  }, []);

  useEffect(() => {
    let mounted = true;
    fetchJobs().finally(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, [fetchJobs]);

  // Auto-open dossier from Morning Brief navigation
  useEffect(() => {
    const jobId = searchParams.get("jobId");
    if (jobId && jobs.length > 0) {
      const entry = jobs.find((j) => j.job.id === parseInt(jobId));
      if (entry) openDossier(entry);
    }
  }, [searchParams, jobs]); // eslint-disable-line react-hooks/exhaustive-deps

  async function openDossier(entry: JobEntry) {
    setSelectedJob(entry);
    setDraftedEmail(null);
    setSelectedScores([]);
    setDescExpanded(false);
    try {
      const res = await fetch(`/api/jobs?id=${entry.job.id}`);
      const data = await res.json();
      if (data.scores) {
        setSelectedScores(data.scores.map((s: { dimension: string; score: number; reason: string }) => ({
          dimension: s.dimension,
          score: s.score,
          reason: s.reason || "",
        })));
      }
      // Update job with full description if available
      if (data.job?.description && !entry.job.description) {
        setSelectedJob({ ...entry, job: { ...entry.job, description: data.job.description } });
      }
    } catch { /* */ }
  }

  const [feedbackPending, setFeedbackPending] = useState<number | null>(null);

  async function handleFeedback(jobId: number, type: "thumbs_up" | "thumbs_down", comment?: string) {
    setFeedbackPending(jobId);
    try {
      // Submit feedback (updates Thompson Sampling weights)
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, type, comment: comment || undefined }),
      });
      setFeedbackComment("");

      if (type === "thumbs_down") {
        // Move job to "passed" stage — removes from active feed
        await fetch("/api/pipeline", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId, stage: "passed" }),
        });
        // Remove from local state immediately
        setJobs((prev) => prev.filter((j) => j.job.id !== jobId));
      } else {
        // Thumbs up: boost score to at least 70 and queue for outreach
        await fetch("/api/feedback", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId, action: "boost" }),
        });
        // Refresh to show updated score
        await fetchJobs();
      }
    } catch { /* */ }
    setFeedbackPending(null);
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
      if (data.email) setDraftedEmail(data.email);
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
      entry.stage !== "passed" && (
      entry.job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.job.company.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dim" />
          <Input placeholder="Search jobs, companies..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10" />
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          {filteredJobs.length} jobs
        </span>
      </div>

      {/* Job Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-dim" />
        </div>
      ) : filteredJobs.length === 0 ? (
        <Card className="bg-background border border-border">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Search className="h-8 w-8 text-dim mb-3" />
            <p className="text-sm text-muted-foreground">No jobs found. Go to the Morning Brief and click &quot;Scan for Jobs&quot;.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredJobs.map((entry) => (
            <Card key={entry.job.id}
              className="bg-background border border-border transition-colors hover:bg-elevated">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => openDossier(entry)}>
                    <div className={`flex h-11 w-11 items-center justify-center rounded-lg border font-mono text-sm font-bold ${getScoreColor(entry.overallScore || 0)}`}>
                      {entry.overallScore || "—"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-loud truncate">{entry.job.title}</h3>
                        {entry.stage && (
                          <Badge variant="outline" className={`text-[10px] ${getStageColor(entry.stage)}`}>
                            {entry.stage}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Building2 className="h-3 w-3" /> {entry.job.company}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" /> {entry.job.location || "—"}
                        </span>
                        {entry.job.salaryMin && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                            <DollarSign className="h-3 w-3" />
                            {(entry.job.salaryMin / 1000).toFixed(0)}K{entry.job.salaryMax ? `–${(entry.job.salaryMax / 1000).toFixed(0)}K` : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 relative z-10" onClickCapture={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      disabled={feedbackPending === entry.job.id}
                      className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-emerald-200 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 transition-colors"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleFeedback(entry.job.id, "thumbs_up"); }}>
                      <ThumbsUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={feedbackPending === entry.job.id}
                      className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleFeedback(entry.job.id, "thumbs_down"); }}>
                      <ThumbsDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Company Dossier */}
      <Sheet open={!!selectedJob} onOpenChange={(open) => !open && setSelectedJob(null)}>
        <SheetContent className="w-[500px] sm:w-[600px] border-border bg-background overflow-y-auto">
          {selectedJob && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-lg border font-mono text-xl font-bold ${getScoreColor(selectedJob.overallScore || 0)}`}>
                    {selectedJob.overallScore || "—"}
                  </div>
                  <div>
                    <SheetTitle className="text-loud text-lg">{selectedJob.job.title}</SheetTitle>
                    <p className="text-sm text-muted-foreground">{selectedJob.job.company} · {selectedJob.job.location}</p>
                  </div>
                </div>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {selectedJob.job.salaryMin && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm text-foreground font-mono">
                      ${(selectedJob.job.salaryMin / 1000).toFixed(0)}K{selectedJob.job.salaryMax ? ` – $${(selectedJob.job.salaryMax / 1000).toFixed(0)}K` : ""} base
                    </span>
                  </div>
                )}

                {/* Description */}
                {selectedJob.job.description && (
                  <div>
                    <h4 className="text-sm font-medium text-loud mb-2">Description</h4>
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {descExpanded ? selectedJob.job.description : selectedJob.job.description.slice(0, 400) + (selectedJob.job.description.length > 400 ? "..." : "")}
                    </p>
                    {selectedJob.job.description.length > 400 && (
                      <Button variant="ghost" size="sm" className="mt-1 text-xs text-rose"
                        onClick={() => setDescExpanded(!descExpanded)}>
                        {descExpanded ? <><ChevronUp className="h-3 w-3 mr-1" /> Show less</> : <><ChevronDown className="h-3 w-3 mr-1" /> Show more</>}
                      </Button>
                    )}
                  </div>
                )}

                {/* Score Breakdown */}
                {selectedScores.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-loud mb-2">Score Breakdown</h4>
                    <ScoreRadar scores={Object.fromEntries(selectedScores.map((s) => [s.dimension, s.score]))} />
                    <Table className="mt-3">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Dimension</TableHead>
                          <TableHead className="text-xs text-right">Score</TableHead>
                          <TableHead className="text-xs">Reason</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedScores.map((s) => (
                          <TableRow key={s.dimension}>
                            <TableCell className="text-xs font-medium">{dimensionLabels[s.dimension] || s.dimension}</TableCell>
                            <TableCell className="text-right font-mono text-xs">{s.score}/5</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{s.reason}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                <Separator className="bg-border" />

                {/* Actions */}
                <div className="space-y-2">
                  <Button className="w-full justify-start gap-2 bg-rose text-primary-foreground hover:bg-rose/90"
                    onClick={() => draftEmail(selectedJob.job.id)} disabled={draftingEmail}>
                    {draftingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {draftingEmail ? "Drafting..." : "Draft Outreach Email"}
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2"
                    onClick={() => scheduleFollowup(selectedJob.job.id)}>
                    <CalendarPlus className="h-4 w-4" /> Schedule Follow-up
                  </Button>
                  {selectedJob.job.url && (
                    <a href={selectedJob.job.url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="w-full justify-start gap-2">
                        <ExternalLink className="h-4 w-4" /> View Original Listing
                      </Button>
                    </a>
                  )}
                </div>

                {/* Drafted Email */}
                {draftedEmail && (
                  <>
                    <Separator className="bg-border" />
                    <div>
                      <h4 className="text-sm font-medium text-loud mb-2">Drafted Email</h4>
                      <div className="rounded-lg bg-background border border-border p-4 space-y-2">
                        <p className="text-xs text-muted-foreground">Subject:</p>
                        <p className="text-sm text-foreground">{draftedEmail.subject}</p>
                        <Separator className="bg-border" />
                        <p className="text-xs text-muted-foreground">Body:</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{draftedEmail.body}</p>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={async () => {
                            try {
                              const res = await fetch("/api/actions", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  action: "send_email",
                                  jobId: selectedJob.job.id,
                                  params: { to: "yueyin.melody0919@gmail.com", subject: draftedEmail.subject, body: draftedEmail.body },
                                }),
                              });
                              const data = await res.json();
                              if (data.sent) alert("Email sent successfully!");
                              else alert("Failed: " + (data.error || "Unknown error"));
                            } catch { alert("Email sending failed"); }
                          }}>
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
                    className="w-full rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-dim p-3 h-16 resize-none focus:outline-none focus:ring-1 focus:ring-rose/50"
                  />
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 gap-2 border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                      onClick={() => { handleFeedback(selectedJob.job.id, "thumbs_up", feedbackComment); setSelectedJob(null); }}>
                      <ThumbsUp className="h-4 w-4" /> More Like This
                    </Button>
                    <Button variant="outline" className="flex-1 gap-2 border-destructive/20 text-destructive hover:bg-destructive/10"
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
