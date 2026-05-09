"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const agents = [
  { name: "Scout", character: "Dwight Schrute", role: "Discovery & Research", status: "active", lastAction: "Found 3 new roles", color: "from-amber-600 to-orange-700", emoji: "🔍" },
  { name: "Analyst", character: "Oscar Martinez", role: "Scoring & Market Intel", status: "active", lastAction: "Scored 5 jobs", color: "from-blue-600 to-indigo-700", emoji: "📊" },
  { name: "Strategist", character: "Jim Halpert", role: "Outreach & Networking", status: "active", lastAction: "Drafted 2 emails", color: "from-green-600 to-emerald-700", emoji: "✉️" },
  { name: "Ops", character: "Angela Martin", role: "Pipeline & Scheduling", status: "active", lastAction: "3 follow-ups scheduled", color: "from-rose-600 to-pink-700", emoji: "⏰" },
  { name: "Engineer", character: "Darryl Philbin", role: "Platform Development", status: "idle", lastAction: "Shipped dark mode", color: "from-gray-600 to-zinc-700", emoji: "🛠️" },
  { name: "Coach", character: "Holly Flax", role: "Learning & Development", status: "active", lastAction: "New skill recommendations", color: "from-purple-600 to-violet-700", emoji: "📚" },
  { name: "QA", character: "Stanley Hudson", role: "Quality Assurance", status: "idle", lastAction: "All tests passing", color: "from-stone-600 to-neutral-700", emoji: "🐛" },
];

export default function AgentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Agent Orchestration</h2>
        <Badge variant="outline" className="border-green-500/30 text-green-400 text-xs">
          {agents.filter((a) => a.status === "active").length} active
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {agents.map((agent) => (
          <Card key={agent.name} className="border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden transition-all hover:border-white/20 cursor-pointer">
            <div className={`h-1.5 bg-gradient-to-r ${agent.color}`} />
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{agent.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">{agent.name}</h3>
                    <div className={`h-2 w-2 rounded-full ${agent.status === "active" ? "bg-green-400 animate-pulse" : "bg-white/20"}`} />
                  </div>
                  <p className="text-xs text-white/50">{agent.character}</p>
                  <p className="text-[10px] text-white/30 mt-1">{agent.role}</p>
                </div>
              </div>
              <div className="mt-3 rounded-lg bg-white/[0.03] border border-white/5 p-2">
                <p className="text-[11px] text-white/50">
                  Last: {agent.lastAction}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
        <CardContent className="flex items-center justify-center h-64 text-white/20">
          <p className="text-sm">React Flow agent orchestration diagram — coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}
