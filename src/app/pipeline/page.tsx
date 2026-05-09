"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PipelineSankey } from "@/components/charts/pipeline-sankey";

const stages = [
  { id: "discovered", label: "Discovered", color: "bg-gray-500", count: 32 },
  { id: "queued", label: "Queued", color: "bg-blue-500", count: 8 },
  { id: "outreached", label: "Outreached", color: "bg-purple-500", count: 5 },
  { id: "applied", label: "Applied", color: "bg-amber-500", count: 3 },
  { id: "interviewing", label: "Interviewing", color: "bg-green-500", count: 2 },
  { id: "offer", label: "Offer", color: "bg-emerald-500", count: 0 },
  { id: "passed", label: "Passed", color: "bg-red-500", count: 4 },
];

const pipelineJobs: Record<string, Array<{ id: number; title: string; company: string; score: number; date: string }>> = {
  discovered: [
    { id: 1, title: "Dir, Strategy", company: "Stripe", score: 82, date: "May 8" },
    { id: 2, title: "VP RevOps", company: "Datadog", score: 79, date: "May 8" },
    { id: 3, title: "Head of Ops", company: "Vercel", score: 85, date: "May 7" },
    { id: 4, title: "Dir, BizOps", company: "Retool", score: 77, date: "May 7" },
  ],
  queued: [
    { id: 5, title: "Dir, S&O", company: "Figma", score: 94, date: "May 9" },
    { id: 6, title: "VP RevOps", company: "Ramp", score: 88, date: "May 8" },
  ],
  outreached: [
    { id: 7, title: "Head of BizOps", company: "Notion", score: 91, date: "May 7" },
    { id: 8, title: "CoS to CEO", company: "Anthropic", score: 86, date: "May 6" },
  ],
  applied: [
    { id: 9, title: "Dir, GTM Ops", company: "Databricks", score: 84, date: "May 5" },
  ],
  interviewing: [
    { id: 10, title: "Dir, S&O", company: "Leena AI", score: 95, date: "May 3" },
  ],
  offer: [],
  passed: [
    { id: 11, title: "VP Ops", company: "Acme Corp", score: 71, date: "May 2" },
  ],
};

function getScoreColor(score: number) {
  if (score >= 90) return "text-green-400";
  if (score >= 80) return "text-blue-400";
  if (score >= 70) return "text-amber-400";
  return "text-red-400";
}

export default function PipelinePage() {
  return (
    <div className="space-y-6">
      {/* Stage summary bar */}
      {/* Sankey Diagram */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-white">Pipeline Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <PipelineSankey />
        </CardContent>
      </Card>

      {/* Stage summary */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {stages.map((stage) => (
          <div
            key={stage.id}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 min-w-fit"
          >
            <div className={`h-2 w-2 rounded-full ${stage.color}`} />
            <span className="text-xs text-white/60">{stage.label}</span>
            <Badge variant="outline" className="text-[10px] border-white/20 text-white/50">
              {stage.count}
            </Badge>
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <div key={stage.id} className="min-w-[260px] flex-shrink-0">
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className={`h-2.5 w-2.5 rounded-full ${stage.color}`} />
              <h3 className="text-sm font-medium text-white/70">{stage.label}</h3>
              <Badge variant="outline" className="text-[10px] border-white/10 text-white/40 ml-auto">
                {(pipelineJobs[stage.id] || []).length}
              </Badge>
            </div>

            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="space-y-2">
                {(pipelineJobs[stage.id] || []).map((job) => (
                  <Card
                    key={job.id}
                    className="border-white/10 bg-white/5 backdrop-blur-sm cursor-pointer transition-all hover:bg-white/[0.08] hover:border-white/20"
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {job.title}
                          </p>
                          <p className="text-xs text-white/50 mt-0.5">{job.company}</p>
                        </div>
                        <span className={`text-sm font-bold ${getScoreColor(job.score)}`}>
                          {job.score}
                        </span>
                      </div>
                      <p className="text-[10px] text-white/30 mt-2">{job.date}</p>
                    </CardContent>
                  </Card>
                ))}

                {(pipelineJobs[stage.id] || []).length === 0 && (
                  <div className="flex items-center justify-center h-20 rounded-lg border border-dashed border-white/10">
                    <p className="text-xs text-white/20">No jobs</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        ))}
      </div>
    </div>
  );
}
