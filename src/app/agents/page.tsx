"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";

interface AgentData {
  name: string;
  lastAction: { action: string; details: string | null; createdAt: string } | null;
  actionsToday: number;
  totalLearnings: number;
  status: string;
}

interface AgentLog {
  agent: string;
  action: string;
  details: string | null;
  outcome: string | null;
  createdAt: string;
}

const AGENT_META: Record<string, { displayName: string; character: string; role: string; avatar: string; color: string }> = {
  scout: { displayName: "Scout", character: "Dwight Schrute", role: "Discovery & Research", avatar: "/avatars/dwight.jpg", color: "from-amber-600 to-orange-700" },
  analyst: { displayName: "Analyst", character: "Oscar Martinez", role: "Scoring & Market Intel", avatar: "/avatars/oscar.jpg", color: "from-blue-600 to-indigo-700" },
  strategist: { displayName: "Strategist", character: "Jim Halpert", role: "Outreach & Networking", avatar: "/avatars/jim.jpg", color: "from-green-600 to-emerald-700" },
  ops: { displayName: "Ops", character: "Angela Martin", role: "Pipeline & Scheduling", avatar: "/avatars/angela.jpg", color: "from-rose-600 to-pink-700" },
  engineer: { displayName: "Engineer", character: "Darryl Philbin", role: "Platform Development", avatar: "/avatars/darryl.jpg", color: "from-gray-600 to-zinc-700" },
  coach: { displayName: "Coach", character: "Holly Flax", role: "Learning & Development", avatar: "/avatars/holly.jpg", color: "from-purple-600 to-violet-700" },
  qa: { displayName: "QA", character: "Stanley Hudson", role: "Quality Assurance", avatar: "/avatars/stanley.jpg", color: "from-stone-600 to-neutral-700" },
};

function toNYC(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/agents");
      const data = await res.json();
      setAgents(data.agents || []);

      // Collect all logs
      const allLogs: AgentLog[] = [];
      for (const agent of data.agents || []) {
        if (agent.lastAction) allLogs.push(agent.lastAction);
      }
      setLogs(allLogs.sort((a: AgentLog, b: AgentLog) => b.createdAt.localeCompare(a.createdAt)));
    } catch { /* */ }
  }, []);

  useEffect(() => {
    let m = true;
    fetchData().finally(() => { if (m) setLoading(false); });
    return () => { m = false; };
  }, [fetchData]);

  // Fetch full activity log for selected agent
  useEffect(() => {
    if (!selectedAgent) return;
    fetch(`/api/agents?agent=${selectedAgent}`)
      .then(r => r.json())
      .then(d => {
        // If the API returns agent-specific logs, use them
        if (d.logs) setLogs(d.logs);
      })
      .catch(() => {});
  }, [selectedAgent]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-white/30" /></div>;
  }

  const filteredLogs = selectedAgent
    ? logs.filter(l => l.agent === selectedAgent)
    : logs;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Agent Orchestration</h2>
        <Badge variant="outline" className="border-green-500/30 text-green-400 text-xs">
          {agents.filter(a => a.status === "active").length} active
        </Badge>
      </div>

      {/* Agent Cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {agents.map((agent) => {
          const meta = AGENT_META[agent.name];
          if (!meta) return null;
          const isSelected = selectedAgent === agent.name;

          return (
            <Card
              key={agent.name}
              className={`border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden cursor-pointer transition-all hover:border-white/20 ${isSelected ? "ring-1 ring-blue-500/50 border-blue-500/30" : ""}`}
              onClick={() => setSelectedAgent(isSelected ? null : agent.name)}
            >
              <div className={`h-1 bg-gradient-to-r ${meta.color}`} />
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-white/10">
                    <AvatarImage src={meta.avatar} alt={meta.character} />
                    <AvatarFallback className="bg-white/10 text-white/50 text-xs">
                      {meta.displayName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{meta.displayName}</span>
                      <div className={`h-2 w-2 rounded-full ${agent.status === "active" ? "bg-green-400 animate-pulse" : "bg-white/20"}`} />
                    </div>
                    <p className="text-[10px] text-white/40">{meta.character} — {meta.role}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex gap-3">
                    <div className="text-center">
                      <p className="text-lg font-bold text-white">{agent.actionsToday}</p>
                      <p className="text-[9px] text-white/30">today</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-white">{agent.totalLearnings}</p>
                      <p className="text-[9px] text-white/30">learnings</p>
                    </div>
                  </div>
                </div>

                {agent.lastAction && (
                  <div className="mt-3 rounded-lg bg-white/[0.03] border border-white/5 p-2">
                    <p className="text-[11px] text-white/50 truncate">
                      {agent.lastAction.action.replace(/_/g, " ")}
                    </p>
                    <p className="text-[9px] text-white/25 mt-0.5">
                      {toNYC(agent.lastAction.createdAt)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Activity Log */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-white">
              {selectedAgent ? `${AGENT_META[selectedAgent]?.displayName} Activity Log` : "All Agent Activity"}
            </CardTitle>
            {selectedAgent && (
              <Badge
                variant="outline"
                className="text-[10px] border-white/10 text-white/40 cursor-pointer hover:text-white/60"
                onClick={() => setSelectedAgent(null)}
              >
                Show all
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            {filteredLogs.length > 0 ? (
              <div className="space-y-2">
                {filteredLogs.map((log, i) => {
                  const meta = AGENT_META[log.agent];
                  return (
                    <div key={i} className="flex items-start gap-3 rounded-lg p-2 hover:bg-white/[0.03] transition-colors">
                      <Avatar className="h-6 w-6 mt-0.5 border border-white/10">
                        <AvatarImage src={meta?.avatar} />
                        <AvatarFallback className="bg-white/10 text-[9px]">{log.agent[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white/80">
                          <span className="font-medium text-white">{meta?.displayName || log.agent}</span>{" "}
                          {log.action.replace(/_/g, " ")}
                        </p>
                        {log.details && (
                          <p className="text-[10px] text-white/30 mt-0.5 truncate">
                            {typeof log.details === "string" ? log.details.slice(0, 120) : JSON.stringify(log.details).slice(0, 120)}
                          </p>
                        )}
                        <p className="text-[9px] text-white/20 mt-0.5">
                          {toNYC(log.createdAt)}
                        </p>
                      </div>
                      {log.outcome && (
                        <Badge variant="outline" className={`text-[9px] ${log.outcome === "success" ? "border-green-500/20 text-green-400/60" : "border-red-500/20 text-red-400/60"}`}>
                          {log.outcome}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-white/30 text-center py-8">
                No activity yet. Interact with agents in Slack to see logs here.
              </p>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
