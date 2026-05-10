"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Briefcase, Mail, TrendingUp, ThumbsUp, ThumbsDown,
  Bot, Search, BarChart3, Loader2, RefreshCw,
} from "lucide-react";

interface PipelineStage { stage: string; count: number }
interface JobEntry {
  job: { id: number; title: string; company: string; location: string; url: string };
  overallScore: number | null;
  stage: string | null;
}
interface AgentLog {
  agent: string; action: string; details: string | null;
  outcome: string | null; createdAt: string;
}

const agentNames: Record<string, string> = {
  scout: "Dwight", analyst: "Oscar", strategist: "Jim", ops: "Angela",
  engineer: "Darryl", coach: "Holly", qa: "Stanley", system: "System",
};

function toNYC(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    timeZone: "America/New_York", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

export default function MorningBrief() {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [recentJobs, setRecentJobs] = useState<JobEntry[]>([]);
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    try {
      const [pipelineRes, jobsRes, agentsRes] = await Promise.all([
        fetch("/api/pipeline"),
        fetch("/api/jobs?limit=20"),
        fetch("/api/agents"),
      ]);

      const pipelineData = await pipelineRes.json();
      const jobsData = await jobsRes.json();
      const agentsData = await agentsRes.json();

      setStages(pipelineData.stages || []);
      setRecentJobs(jobsData.jobs || []);

      const logs: AgentLog[] = [];
      for (const agent of agentsData.agents || []) {
        if (agent.lastAction) logs.push(agent.lastAction);
      }
      setAgentLogs(logs.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));

      // Feedback count
      try {
        const fbRes = await fetch("/api/preferences");
        const fbData = await fbRes.json();
        setFeedbackCount(fbData.feedbackCount || 0);
      } catch { /* */ }
    } catch {
      // API might not be ready yet
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    fetchData().finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [fetchData]);

  async function triggerScan() {
    setScanning(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "scan" }),
      });
      const data = await res.json();
      alert(`Scan complete: ${data.count} new jobs found`);
      fetchData();
    } catch {
      alert("Scan failed — check API keys in .env");
    }
    setScanning(false);
  }

  async function triggerBatchScore() {
    setScoring(true);
    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch: true }),
      });
      const data = await res.json();
      const scored = data.results?.filter((r: { status: string }) => r.status === "scored").length || 0;
      alert(`Scored ${scored} jobs`);
      fetchData();
    } catch {
      alert("Scoring failed — check ANTHROPIC_API_KEY in .env");
    }
    setScoring(false);
  }

  const totalJobs = stages.reduce((s, st) => s + st.count, 0);
  const scoredJobs = recentJobs.filter(j => j.overallScore !== null).length;
  const outreachedJobs = stages.find(s => s.stage === "outreached")?.count || 0;
  const interviewJobs = stages.find(s => s.stage === "interviewing")?.count || 0;

  const stats = [
    { label: "Discovered", value: String(totalJobs), icon: Search },
    { label: "Scored", value: String(scoredJobs), icon: BarChart3 },
    { label: "Outreached", value: String(outreachedJobs), icon: Mail },
    { label: "Interviews", value: String(interviewJobs), icon: Briefcase },
    { label: "Feedback", value: String(feedbackCount), icon: TrendingUp },
  ];

  async function handleApprove(entry: JobEntry) {
    setApprovingId(entry.job.id);
    try {
      await fetch("/api/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "draft_email", jobId: entry.job.id }),
      });
      await fetch("/api/pipeline", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: entry.job.id, stage: "queued" }),
      });
      fetchData();
    } catch { /* */ }
    setApprovingId(null);
  }

  async function handleReject(entry: JobEntry) {
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: entry.job.id, type: "thumbs_down" }),
      });
      fetchData();
    } catch { /* */ }
  }

  const approvalQueue = recentJobs
    .filter(j => j.overallScore && j.overallScore >= 80 && j.stage === "discovered")
    .sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button onClick={triggerScan} disabled={scanning} className="bg-rose text-primary-foreground hover:bg-rose/90">
          {scanning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
          {scanning ? "Scanning..." : "Scan for Jobs"}
        </Button>
        <Button onClick={triggerBatchScore} disabled={scoring} variant="outline">
          {scoring ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <BarChart3 className="h-4 w-4 mr-2" />}
          {scoring ? "Scoring..." : "Score Unscored Jobs"}
        </Button>
        <Button onClick={fetchData} variant="ghost" className="text-muted-foreground hover:text-foreground">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-background border border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-loud font-mono">{loading ? "—" : stat.value}</p>
                </div>
                <stat.icon className="h-8 w-8 text-dim" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Approval Queue / Recent Jobs */}
        <div className="lg:col-span-2">
          <Card className="bg-background border border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-loud">
                  {approvalQueue.length > 0 ? "Approval Queue" : "Recent Jobs"}
                </CardTitle>
                {approvalQueue.length > 0 && (
                  <Badge variant="outline" className="border-blue-200 text-rose text-xs">
                    {approvalQueue.length} pending
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {(approvalQueue.length > 0 ? approvalQueue : recentJobs.slice(0, 5)).map((entry) => (
                <div key={entry.job.id} className="group flex items-center justify-between rounded-lg border border-border bg-background p-4 transition-colors hover:bg-elevated cursor-pointer"
                  onClick={() => router.push(`/feed?jobId=${entry.job.id}`)}>
                  <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg font-mono text-sm font-bold ${
                      (entry.overallScore || 0) >= 90 ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                      : (entry.overallScore || 0) >= 80 ? "bg-blue-50 text-rose border border-blue-200"
                      : "bg-elevated text-muted-foreground border border-border"
                    }`}>
                      {entry.overallScore || "—"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-loud">{entry.job.company}</span>
                        <span className="text-xs text-foreground">{entry.job.title}</span>
                      </div>
                      <p className="text-xs text-dim mt-0.5">{entry.job.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button size="sm" variant="ghost" className="h-8 text-emerald-600 hover:text-emerald-600 hover:bg-emerald-50"
                      disabled={approvingId === entry.job.id}
                      onClick={(e) => { e.stopPropagation(); handleApprove(entry); }}>
                      {approvingId === entry.job.id ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <ThumbsUp className="h-3.5 w-3.5 mr-1" />}
                      Approve
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 text-subtle hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => { e.stopPropagation(); handleReject(entry); }}>
                      <ThumbsDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              {recentJobs.length === 0 && !loading && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No jobs yet. Click &quot;Scan for Jobs&quot; to discover opportunities.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Agent Activity Feed */}
        <Card className="bg-background border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-loud flex items-center gap-2">
              <Bot className="h-4 w-4 text-rose" />
              Agent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[320px]">
              <div className="space-y-1">
                {agentLogs.length > 0 ? agentLogs.map((log, i) => (
                  <div key={i} className="flex gap-3 rounded-lg p-2.5 transition-colors hover:bg-elevated">
                    <div className="h-6 w-6 rounded-md bg-elevated flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                      {(agentNames[log.agent] || log.agent)[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground">
                        <span className="font-medium text-loud">{agentNames[log.agent] || log.agent}</span>{" "}
                        <span className="text-muted-foreground">{log.action.replace(/_/g, " ")}</span>
                      </p>
                      <p className="text-[10px] text-dim mt-0.5">
                        {toNYC(log.createdAt)}
                      </p>
                    </div>
                  </div>
                )) : (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No activity yet. Scan for jobs to get started.
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
