"use client";

import { useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

const agents = [
  { name: "Scout", character: "Dwight Schrute", role: "Discovery & Research", status: "active", lastAction: "Found 3 new roles", color: "from-amber-600 to-orange-700", emoji: "🔍", actionsToday: 12 },
  { name: "Analyst", character: "Oscar Martinez", role: "Scoring & Market Intel", status: "active", lastAction: "Scored 5 jobs", color: "from-blue-600 to-indigo-700", emoji: "📊", actionsToday: 8 },
  { name: "Strategist", character: "Jim Halpert", role: "Outreach & Networking", status: "active", lastAction: "Drafted 2 emails", color: "from-green-600 to-emerald-700", emoji: "✉️", actionsToday: 5 },
  { name: "Ops", character: "Angela Martin", role: "Pipeline & Scheduling", status: "active", lastAction: "3 follow-ups scheduled", color: "from-rose-600 to-pink-700", emoji: "⏰", actionsToday: 7 },
  { name: "Engineer", character: "Darryl Philbin", role: "Platform Development", status: "idle", lastAction: "Shipped dark mode", color: "from-gray-600 to-zinc-700", emoji: "🛠️", actionsToday: 2 },
  { name: "Coach", character: "Holly Flax", role: "Learning & Development", status: "active", lastAction: "New skill recommendations", color: "from-purple-600 to-violet-700", emoji: "📚", actionsToday: 3 },
  { name: "QA", character: "Stanley Hudson", role: "Quality Assurance", status: "idle", lastAction: "All tests passing", color: "from-stone-600 to-neutral-700", emoji: "🐛", actionsToday: 1 },
];

function AgentNode({ data }: { data: typeof agents[0] }) {
  return (
    <div className="rounded-xl border border-white/20 bg-black/80 backdrop-blur-xl p-4 min-w-[180px] shadow-lg shadow-black/50">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{data.emoji}</span>
        <div>
          <p className="text-sm font-semibold text-white">{data.name}</p>
          <p className="text-[10px] text-white/40">{data.character}</p>
        </div>
        <div className={`ml-auto h-2.5 w-2.5 rounded-full ${data.status === "active" ? "bg-green-400 animate-pulse" : "bg-white/20"}`} />
      </div>
      <p className="text-[10px] text-white/50 mb-2">{data.role}</p>
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-white/30">{data.lastAction}</p>
        <Badge variant="outline" className="text-[9px] border-white/10 text-white/40">
          {data.actionsToday} today
        </Badge>
      </div>
    </div>
  );
}

const nodeTypes = { agent: AgentNode };

export default function AgentsPage() {
  const nodes: Node[] = useMemo(() => [
    // Central orchestrator
    { id: "orchestrator", position: { x: 350, y: 20 }, data: { label: "🧠 Orchestrator" }, type: "default",
      style: { background: "rgba(59,130,246,0.2)", border: "1px solid rgba(59,130,246,0.4)", color: "white", borderRadius: "12px", padding: "12px 20px", fontSize: "14px", fontWeight: "600" } },
    // Shared memory
    { id: "memory", position: { x: 350, y: 420 }, data: { label: "💾 Shared Memory (SQLite)" }, type: "default",
      style: { background: "rgba(168,85,247,0.2)", border: "1px solid rgba(168,85,247,0.4)", color: "white", borderRadius: "12px", padding: "10px 16px", fontSize: "12px" } },
    // Agents in a circle around orchestrator
    { id: "scout", position: { x: 50, y: 120 }, data: agents[0], type: "agent", sourcePosition: Position.Bottom, targetPosition: Position.Top },
    { id: "analyst", position: { x: 280, y: 120 }, data: agents[1], type: "agent", sourcePosition: Position.Bottom, targetPosition: Position.Top },
    { id: "strategist", position: { x: 520, y: 120 }, data: agents[2], type: "agent", sourcePosition: Position.Bottom, targetPosition: Position.Top },
    { id: "ops", position: { x: 720, y: 120 }, data: agents[3], type: "agent", sourcePosition: Position.Bottom, targetPosition: Position.Top },
    { id: "engineer", position: { x: 50, y: 290 }, data: agents[4], type: "agent", sourcePosition: Position.Bottom, targetPosition: Position.Top },
    { id: "coach", position: { x: 350, y: 290 }, data: agents[5], type: "agent", sourcePosition: Position.Bottom, targetPosition: Position.Top },
    { id: "qa", position: { x: 640, y: 290 }, data: agents[6], type: "agent", sourcePosition: Position.Bottom, targetPosition: Position.Top },
  ], []);

  const edges: Edge[] = useMemo(() => [
    // Orchestrator to agents
    { id: "o-scout", source: "orchestrator", target: "scout", animated: true, style: { stroke: "rgba(251,191,36,0.5)" } },
    { id: "o-analyst", source: "orchestrator", target: "analyst", animated: true, style: { stroke: "rgba(59,130,246,0.5)" } },
    { id: "o-strategist", source: "orchestrator", target: "strategist", animated: true, style: { stroke: "rgba(34,197,94,0.5)" } },
    { id: "o-ops", source: "orchestrator", target: "ops", animated: true, style: { stroke: "rgba(244,63,94,0.5)" } },
    // Agent-to-agent flows
    { id: "scout-analyst", source: "scout", target: "analyst", animated: true, label: "new jobs", style: { stroke: "rgba(251,191,36,0.3)" }, labelStyle: { fill: "rgba(255,255,255,0.3)", fontSize: "10px" } },
    { id: "analyst-strategist", source: "analyst", target: "strategist", animated: true, label: "scored 85+", style: { stroke: "rgba(59,130,246,0.3)" }, labelStyle: { fill: "rgba(255,255,255,0.3)", fontSize: "10px" } },
    { id: "strategist-ops", source: "strategist", target: "ops", animated: true, label: "email sent", style: { stroke: "rgba(34,197,94,0.3)" }, labelStyle: { fill: "rgba(255,255,255,0.3)", fontSize: "10px" } },
    // All agents to shared memory
    { id: "scout-mem", source: "scout", target: "memory", style: { stroke: "rgba(168,85,247,0.2)", strokeDasharray: "4 4" } },
    { id: "analyst-mem", source: "analyst", target: "memory", style: { stroke: "rgba(168,85,247,0.2)", strokeDasharray: "4 4" } },
    { id: "strategist-mem", source: "strategist", target: "memory", style: { stroke: "rgba(168,85,247,0.2)", strokeDasharray: "4 4" } },
    { id: "ops-mem", source: "ops", target: "memory", style: { stroke: "rgba(168,85,247,0.2)", strokeDasharray: "4 4" } },
    { id: "engineer-mem", source: "engineer", target: "memory", style: { stroke: "rgba(168,85,247,0.2)", strokeDasharray: "4 4" } },
    { id: "coach-mem", source: "coach", target: "memory", style: { stroke: "rgba(168,85,247,0.2)", strokeDasharray: "4 4" } },
    { id: "qa-mem", source: "qa", target: "memory", style: { stroke: "rgba(168,85,247,0.2)", strokeDasharray: "4 4" } },
    // QA monitors all
    { id: "qa-engineer", source: "qa", target: "engineer", style: { stroke: "rgba(120,113,108,0.3)", strokeDasharray: "6 3" }, label: "bug reports", labelStyle: { fill: "rgba(255,255,255,0.2)", fontSize: "9px" } },
    // Coach observes analyst
    { id: "coach-analyst", source: "analyst", target: "coach", style: { stroke: "rgba(168,85,247,0.3)", strokeDasharray: "6 3" }, label: "skill gaps", labelStyle: { fill: "rgba(255,255,255,0.2)", fontSize: "9px" } },
  ], []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Agent Orchestration</h2>
        <Badge variant="outline" className="border-green-500/30 text-green-400 text-xs">
          {agents.filter((a) => a.status === "active").length} active
        </Badge>
      </div>

      {/* React Flow Diagram */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
        <div className="h-[520px]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
            style={{ background: "transparent" }}
          >
            <Background color="rgba(255,255,255,0.03)" gap={20} />
            <Controls
              style={{ background: "rgba(0,0,0,0.5)", borderColor: "rgba(255,255,255,0.1)" }}
            />
          </ReactFlow>
        </div>
      </Card>

      {/* Agent Cards Grid */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        {agents.map((agent) => (
          <Card key={agent.name} className="border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden transition-all hover:border-white/20 cursor-pointer">
            <div className={`h-1 bg-gradient-to-r ${agent.color}`} />
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{agent.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-white">{agent.name}</span>
                    <div className={`h-1.5 w-1.5 rounded-full ${agent.status === "active" ? "bg-green-400 animate-pulse" : "bg-white/20"}`} />
                  </div>
                  <p className="text-[10px] text-white/40">{agent.character}</p>
                </div>
                <Badge variant="outline" className="text-[9px] border-white/10 text-white/40">
                  {agent.actionsToday}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
