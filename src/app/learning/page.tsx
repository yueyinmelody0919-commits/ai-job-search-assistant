"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, ExternalLink, CheckCircle, Clock } from "lucide-react";

const skills = [
  {
    topic: "AI Agent Architectures",
    relevance: "Top companies want AI-native leaders",
    status: "in_progress",
    resources: [
      { label: "DeepLearning.AI — AI Agents", url: "https://www.deeplearning.ai/short-courses/ai-agents-in-langgraph/" },
      { label: "Lilian Weng — Agent Overview", url: "https://lilianweng.github.io/posts/2023-06-23-agent/" },
    ],
  },
  {
    topic: "Consumption-Based Pricing",
    relevance: "Increasingly common GTM model — useful for ops interviews",
    status: "suggested",
    resources: [
      { label: "OpenView Pricing Guide", url: "https://openviewpartners.com/blog/consumption-based-pricing/" },
      { label: "Kyle Poyar on Substack", url: "https://kylepoyar.substack.com/" },
    ],
  },
  {
    topic: "Multi-Agent Systems",
    relevance: "Core to AI-native operations and product roles",
    status: "in_progress",
    resources: [
      { label: "CrewAI Documentation", url: "https://docs.crewai.com/" },
      { label: "Anthropic Tool Use Guide", url: "https://docs.anthropic.com/en/docs/build-with-claude/tool-use" },
    ],
  },
  {
    topic: "PLG + Enterprise Sales Hybrid",
    relevance: "Multiple target companies use this GTM motion",
    status: "suggested",
    resources: [
      { label: "Notion GTM Case Study", url: "https://www.notion.so/blog/topic/business" },
      { label: "Figma S-1 GTM Analysis", url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=figma" },
    ],
  },
  {
    topic: "Claude Code + MCP Servers",
    relevance: "Core skill for AI-native operations roles",
    status: "completed",
    resources: [
      { label: "Anthropic Claude Docs", url: "https://docs.anthropic.com/" },
      { label: "MCP GitHub Repository", url: "https://github.com/modelcontextprotocol" },
    ],
  },
];

function getStatusBadge(status: string) {
  switch (status) {
    case "completed":
      return <Badge variant="outline" className="border-emerald-200 text-emerald-700 text-[10px]"><CheckCircle className="h-3 w-3 mr-1" />Done</Badge>;
    case "in_progress":
      return <Badge variant="outline" className="border-blue-200 text-blue-700 text-[10px]"><Clock className="h-3 w-3 mr-1" />Learning</Badge>;
    default:
      return <Badge variant="outline" className="text-[10px]">Suggested</Badge>;
  }
}

export default function LearningPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <GraduationCap className="h-5 w-5 text-rose" />
        <h2 className="text-sm font-semibold text-loud">Learning & Development</h2>
        <Badge variant="outline" className="border-blue-200 text-rose text-xs">
          Holly&apos;s recommendations
        </Badge>
      </div>

      <div className="space-y-2">
        {skills.map((skill) => (
          <Card key={skill.topic} className="bg-background border border-border">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-loud">{skill.topic}</h3>
                    {getStatusBadge(skill.status)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{skill.relevance}</p>
                  <div className="flex gap-3 mt-2">
                    {skill.resources.map((r) => (
                      <a key={r.url} href={r.url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-rose-dim hover:text-rose transition-colors">
                        <ExternalLink className="h-3 w-3" /> {r.label}
                      </a>
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
