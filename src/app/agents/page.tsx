"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Loader2, ChevronLeft, Activity, Wrench, Clock, BookOpen, Database,
} from "lucide-react";

interface AgentSummary {
  name: string;
  lastAction: { action: string; details: string | null; createdAt: string } | null;
  actionsToday: number;
  totalLearnings: number;
  status: string;
}

interface AgentDetail {
  name: string;
  displayName: string;
  character: string;
  role: string;
  avatar: string;
  capabilities: Array<{ name: string; enabled: boolean }>;
  schedule: Array<{ task: string; frequency: string }>;
  totalActions: number;
  recentLogs: Array<{ action: string; details: string | null; outcome: string | null; createdAt: string }>;
  learnings: Array<{ learning: string; createdAt: string }>;
  knowledge: Array<{ title: string; category: string; createdAt: string }>;
}

const AGENT_META: Record<string, { displayName: string; character: string; role: string; avatar: string }> = {
  scout: { displayName: "Scout", character: "Dwight Schrute", role: "Discovery & Research", avatar: "/avatars/dwight.jpg" },
  analyst: { displayName: "Analyst", character: "Oscar Martinez", role: "Scoring & Market Intel", avatar: "/avatars/oscar.jpg" },
  strategist: { displayName: "Strategist", character: "Jim Halpert", role: "Outreach & Networking", avatar: "/avatars/jim.jpg" },
  ops: { displayName: "Ops", character: "Angela Martin", role: "Pipeline & Scheduling", avatar: "/avatars/angela.jpg" },
  engineer: { displayName: "Engineer", character: "Darryl Philbin", role: "Platform Development", avatar: "/avatars/darryl.jpg" },
  coach: { displayName: "Coach", character: "Holly Flax", role: "Learning & Development", avatar: "/avatars/holly.jpg" },
  qa: { displayName: "QA", character: "Stanley Hudson", role: "Quality Assurance", avatar: "/avatars/stanley.jpg" },
};

function toNYC(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    timeZone: "America/New_York", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [agentDetail, setAgentDetail] = useState<AgentDetail | null>(null);
  const [activeTab, setActiveTab] = useState<"activity" | "capabilities" | "schedule" | "knowledge">("activity");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch("/api/agents");
      const data = await res.json();
      setAgents(data.agents || []);
    } catch { /* */ }
  }, []);

  useEffect(() => {
    let m = true;
    fetchAgents().finally(() => { if (m) setLoading(false); });
    return () => { m = false; };
  }, [fetchAgents]);

  async function openAgentDetail(name: string) {
    setSelectedAgent(name);
    setActiveTab("activity");
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/agents/config?agent=${name}`);
      const data = await res.json();
      if (data.agents?.[0]) setAgentDetail(data.agents[0]);
    } catch { /* */ }
    setDetailLoading(false);
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-dim" /></div>;
  }

  // Detail view
  if (selectedAgent && agentDetail) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => { setSelectedAgent(null); setAgentDetail(null); }}
            className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <Avatar className="h-10 w-10 border border-border">
            <AvatarImage src={agentDetail.avatar} alt={agentDetail.character} />
            <AvatarFallback className="bg-elevated text-xs">{agentDetail.displayName[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-sm font-semibold text-loud">{agentDetail.displayName}</h2>
            <p className="text-xs text-muted-foreground">{agentDetail.character} — {agentDetail.role}</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-loud font-mono">{agentDetail.totalActions} total actions</span>
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {([
            { id: "activity" as const, label: "Activity", icon: Activity },
            { id: "capabilities" as const, label: "Capabilities", icon: Wrench },
            { id: "schedule" as const, label: "Schedule", icon: Clock },
            { id: "knowledge" as const, label: "Knowledge", icon: Database },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-rose text-loud"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "activity" && (
          <Card className="bg-background border border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-loud">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {agentDetail.recentLogs.length > 0 ? (
                  <div className="space-y-1">
                    {agentDetail.recentLogs.map((log, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-lg p-2.5 hover:bg-elevated transition-colors">
                        <div className="h-1.5 w-1.5 rounded-full bg-rose mt-1.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-foreground">{log.action.replace(/_/g, " ")}</p>
                          {log.details && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                              {typeof log.details === "string" ? log.details.slice(0, 150) : JSON.stringify(log.details).slice(0, 150)}
                            </p>
                          )}
                          <p className="text-[10px] text-dim mt-0.5 font-mono">{toNYC(log.createdAt)}</p>
                        </div>
                        {log.outcome && (
                          <Badge variant="outline" className={`text-[9px] shrink-0 ${
                            log.outcome === "success" ? "border-emerald-200 text-emerald-600" : "border-destructive/20 text-destructive"
                          }`}>
                            {log.outcome}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-8">No activity recorded yet.</p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {activeTab === "capabilities" && (
          <Card className="bg-background border border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-loud">Capabilities</CardTitle>
              <p className="text-xs text-muted-foreground">Toggle capabilities on or off. Disabled capabilities will not be available to this agent at runtime.</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {agentDetail.capabilities.map((cap) => (
                  <div key={cap.name} className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${cap.enabled ? "bg-emerald-500" : "bg-dim"}`} />
                      <span className={`text-sm ${cap.enabled ? "text-foreground" : "text-muted-foreground line-through"}`}>{cap.name}</span>
                    </div>
                    <Switch
                      checked={cap.enabled}
                      onCheckedChange={async (checked) => {
                        // Optimistic update
                        setAgentDetail((prev) => prev ? {
                          ...prev,
                          capabilities: prev.capabilities.map((c) =>
                            c.name === cap.name ? { ...c, enabled: checked } : c
                          ),
                        } : prev);
                        try {
                          await fetch("/api/agents/config", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ agent: agentDetail.name, capability: cap.name, enabled: checked }),
                          });
                        } catch {
                          // Rollback on failure
                          setAgentDetail((prev) => prev ? {
                            ...prev,
                            capabilities: prev.capabilities.map((c) =>
                              c.name === cap.name ? { ...c, enabled: !checked } : c
                            ),
                          } : prev);
                        }
                      }}
                      className="data-[state=checked]:bg-rose"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "schedule" && (
          <Card className="bg-background border border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-loud">Scheduled Tasks</CardTitle>
              <p className="text-xs text-muted-foreground">Background jobs this agent runs automatically.</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {agentDetail.schedule.map((task) => (
                  <div key={task.task} className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
                    <span className="text-sm text-foreground">{task.task}</span>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {task.frequency}
                    </Badge>
                  </div>
                ))}
                {agentDetail.schedule.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No scheduled tasks.</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "knowledge" && (
          <div className="space-y-4">
            {/* Learnings */}
            <Card className="bg-background border border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-loud">
                  Learnings
                  <span className="ml-2 text-xs font-normal text-muted-foreground font-mono">({agentDetail.learnings.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {agentDetail.learnings.length > 0 ? (
                  <div className="space-y-2">
                    {agentDetail.learnings.map((l, i) => (
                      <div key={i} className="rounded-lg border border-border bg-background p-3">
                        <p className="text-xs text-foreground">{l.learning}</p>
                        <p className="text-[10px] text-dim mt-1 font-mono">{toNYC(l.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">No learnings recorded yet.</p>
                )}
              </CardContent>
            </Card>

            {/* Knowledge Base Entries */}
            <Card className="bg-background border border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-loud">
                  Knowledge Base
                  <span className="ml-2 text-xs font-normal text-muted-foreground font-mono">({agentDetail.knowledge.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {agentDetail.knowledge.length > 0 ? (
                  <div className="space-y-2">
                    {agentDetail.knowledge.map((k, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
                        <div>
                          <p className="text-xs text-foreground">{k.title}</p>
                          <p className="text-[10px] text-dim mt-0.5 font-mono">{toNYC(k.createdAt)}</p>
                        </div>
                        <Badge variant="outline" className="text-[9px] shrink-0">{k.category}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">No knowledge entries yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // Grid view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-loud">Agent Orchestration</h2>
        <Badge variant="outline" className="border-emerald-200 text-emerald-600 text-xs">
          {agents.filter(a => a.status === "active").length} active
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {agents.map((agent) => {
          const meta = AGENT_META[agent.name];
          if (!meta) return null;

          return (
            <Card
              key={agent.name}
              className="bg-background border border-border overflow-hidden cursor-pointer transition-colors hover:bg-elevated"
              onClick={() => openAgentDetail(agent.name)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-border">
                    <AvatarImage src={meta.avatar} alt={meta.character} />
                    <AvatarFallback className="bg-elevated text-muted-foreground text-xs">
                      {meta.displayName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-loud">{meta.displayName}</span>
                      <div className={`h-1.5 w-1.5 rounded-full ${agent.status === "active" ? "bg-emerald-500" : "bg-dim"}`} />
                    </div>
                    <p className="text-[10px] text-muted-foreground">{meta.character} — {meta.role}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-4">
                  <div>
                    <p className="text-lg font-bold text-loud font-mono">{agent.actionsToday}</p>
                    <p className="text-[9px] text-dim">today</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-loud font-mono">{agent.totalLearnings}</p>
                    <p className="text-[9px] text-dim">learnings</p>
                  </div>
                </div>

                {agent.lastAction && (
                  <div className="mt-3 rounded-md bg-elevated border border-border p-2">
                    <p className="text-[11px] text-muted-foreground truncate">
                      {agent.lastAction.action.replace(/_/g, " ")}
                    </p>
                    <p className="text-[9px] text-dim mt-0.5 font-mono">
                      {toNYC(agent.lastAction.createdAt)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {detailLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-dim" />
        </div>
      )}
    </div>
  );
}
