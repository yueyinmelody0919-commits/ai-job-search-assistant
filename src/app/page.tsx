"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Briefcase, Mail, TrendingUp, ThumbsUp, ThumbsDown,
  Bot, Search, BarChart3, Pen, Loader2, RefreshCw,
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

const agentEmojis: Record<string, string> = {
  scout: "🔍", analyst: "📊", strategist: "✉️", ops: "⏰",
  engineer: "🛠️", coach: "📚", qa: "🐛", system: "⚙️",
};
const agentNames: Record<string, string> = {
  scout: "Dwight", analyst: "Oscar", strategist: "Jim", ops: "Angela",
  engineer: "Darryl", coach: "Holly", qa: "Stanley", system: "System",
};

export default function MorningBrief() {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [recentJobs, setRecentJobs] = useState<JobEntry[]>([]);
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [loading, setLoading] = useState(true);

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
    { label: "Jobs Discovered", value: String(totalJobs), icon: Search, color: "text-blue-400" },
    { label: "Scored", value: String(scoredJobs), icon: BarChart3, color: "text-purple-400" },
    { label: "Outreached", value: String(outreachedJobs), icon: Mail, color: "text-green-400" },
    { label: "Interviews", value: String(interviewJobs), icon: Briefcase, color: "text-amber-400" },
  ];

  // High-score jobs pending approval
  const approvalQueue = recentJobs
    .filter(j => j.overallScore && j.overallScore >= 80 && j.stage === "discovered")
    .sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button onClick={triggerScan} disabled={scanning} className="bg-blue-600 hover:bg-blue-700">
          {scanning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
          {scanning ? "Scanning..." : "Scan for Jobs"}
        </Button>
        <Button onClick={triggerBatchScore} disabled={scoring} variant="outline" className="border-white/10 text-white/70 hover:bg-white/10">
          {scoring ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <BarChart3 className="h-4 w-4 mr-2" />}
          {scoring ? "Scoring..." : "Score Unscored Jobs"}
        </Button>
        <Button onClick={fetchData} variant="ghost" className="text-white/40 hover:text-white">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/50">{stat.label}</p>
                  <p className="text-2xl font-bold text-white">{loading ? "—" : stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color} opacity-50`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Approval Queue / Recent High-Score Jobs */}
        <div className="lg:col-span-2">
          <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-white">
                  {approvalQueue.length > 0 ? "Approval Queue" : "Recent Jobs"}
                </CardTitle>
                {approvalQueue.length > 0 && (
                  <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs">
                    {approvalQueue.length} pending
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {(approvalQueue.length > 0 ? approvalQueue : recentJobs.slice(0, 5)).map((entry) => (
                <div key={entry.job.id} className="group flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.05]">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      (entry.overallScore || 0) >= 90 ? "bg-green-500/20 text-green-400"
                      : (entry.overallScore || 0) >= 80 ? "bg-blue-500/20 text-blue-400"
                      : "bg-white/10 text-white/40"
                    }`}>
                      <span className="text-sm font-bold">{entry.overallScore || "—"}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{entry.job.company}</span>
                        <span className="text-xs text-white/40">{entry.job.title}</span>
                      </div>
                      <p className="text-xs text-white/30 mt-0.5">{entry.job.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button size="sm" variant="ghost" className="h-8 text-green-400 hover:text-green-300 hover:bg-green-500/10">
                      <ThumbsUp className="h-3.5 w-3.5 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 text-red-400/60 hover:text-red-400 hover:bg-red-500/10">
                      <ThumbsDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              {recentJobs.length === 0 && !loading && (
                <p className="text-sm text-white/30 text-center py-8">
                  No jobs yet. Click &quot;Scan for Jobs&quot; to discover opportunities.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Agent Activity Feed */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <Bot className="h-4 w-4 text-blue-400" />
              Agent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[320px]">
              <div className="space-y-3">
                {agentLogs.length > 0 ? agentLogs.map((log, i) => (
                  <div key={i} className="flex gap-3 rounded-lg p-2 transition-colors hover:bg-white/[0.03]">
                    <span className="text-lg">{agentEmojis[log.agent] || "🤖"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/80">
                        <span className="font-medium text-white">{agentNames[log.agent] || log.agent}</span>{" "}
                        {log.action.replace(/_/g, " ")}
                      </p>
                      <p className="text-[10px] text-white/30 mt-0.5">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                )) : (
                  <p className="text-xs text-white/30 text-center py-4">
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
