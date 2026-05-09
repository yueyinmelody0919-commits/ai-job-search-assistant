"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap, ExternalLink, CheckCircle, Clock } from "lucide-react";

const skills = [
  { topic: "AI Agent Architectures", relevance: "Top companies want AI-native leaders", status: "in_progress", resources: ["deeplearning.ai/agents", "Lilian Weng's blog"] },
  { topic: "Consumption-Based Pricing", relevance: "Leena AI uses this model — interview topic", status: "suggested", resources: ["OpenView pricing guide", "Kyle Poyar newsletter"] },
  { topic: "Multi-Agent Systems", relevance: "Aligns with Leena's product architecture", status: "in_progress", resources: ["CrewAI docs", "Anthropic tool use guide"] },
  { topic: "PLG + Enterprise Sales Hybrid", relevance: "Multiple target companies use this GTM motion", status: "suggested", resources: ["Notion GTM case study", "Figma S-1 analysis"] },
  { topic: "Claude Code + MCP Servers", relevance: "Core skill for AI-native operations roles", status: "completed", resources: ["Anthropic docs", "MCP GitHub repo"] },
];

function getStatusBadge(status: string) {
  switch (status) {
    case "completed": return <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-[10px]"><CheckCircle className="h-3 w-3 mr-1" />Done</Badge>;
    case "in_progress": return <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-[10px]"><Clock className="h-3 w-3 mr-1" />Learning</Badge>;
    default: return <Badge className="bg-white/10 text-white/40 border-white/10 text-[10px]">Suggested</Badge>;
  }
}

export default function LearningPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <GraduationCap className="h-5 w-5 text-purple-400" />
        <h2 className="text-lg font-semibold text-white">Learning & Development</h2>
        <Badge variant="outline" className="border-purple-500/30 text-purple-400 text-xs">
          Holly&apos;s recommendations
        </Badge>
      </div>

      <div className="space-y-3">
        {skills.map((skill) => (
          <Card key={skill.topic} className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-white">{skill.topic}</h3>
                    {getStatusBadge(skill.status)}
                  </div>
                  <p className="text-xs text-white/40 mt-1">{skill.relevance}</p>
                  <div className="flex gap-2 mt-2">
                    {skill.resources.map((r) => (
                      <Button key={r} variant="ghost" size="sm" className="h-6 text-[10px] text-white/30 hover:text-white px-2">
                        <ExternalLink className="h-3 w-3 mr-1" /> {r}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
