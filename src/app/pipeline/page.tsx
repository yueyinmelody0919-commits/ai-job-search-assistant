"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PipelineSankey } from "@/components/charts/pipeline-sankey";
import { Loader2 } from "lucide-react";

interface PipelineStage { stage: string; count: number }
interface PipelineEntry {
  pipeline: { id: number; jobId: number; stage: string; notes: string | null; updatedAt: string };
  job: { id: number; title: string; company: string; location: string };
}

const STAGES = [
  { id: "discovered", label: "Discovered", color: "bg-gray-500" },
  { id: "queued", label: "Queued", color: "bg-blue-500" },
  { id: "outreached", label: "Outreached", color: "bg-purple-500" },
  { id: "applied", label: "Applied", color: "bg-amber-500" },
  { id: "interviewing", label: "Interviewing", color: "bg-green-500" },
  { id: "offer", label: "Offer", color: "bg-emerald-500" },
  { id: "passed", label: "Passed", color: "bg-red-500" },
];

export default function PipelinePage() {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [entries, setEntries] = useState<PipelineEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPipeline = useCallback(async () => {
    try {
      const res = await fetch("/api/pipeline");
      const data = await res.json();
      setStages(data.stages || []);
      setEntries(data.entries || []);
    } catch { /* */ }
  }, []);

  useEffect(() => {
    let mounted = true;
    fetchPipeline().finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [fetchPipeline]);

  function getStageCount(stageId: string): number {
    return stages.find(s => s.stage === stageId)?.count || 0;
  }

  function getStageEntries(stageId: string): PipelineEntry[] {
    return entries.filter(e => e.pipeline.stage === stageId);
  }

  const sankeyData = {
    discovered: getStageCount("discovered"),
    queued: getStageCount("queued"),
    outreached: getStageCount("outreached"),
    applied: getStageCount("applied"),
    interviewing: getStageCount("interviewing"),
    offer: getStageCount("offer"),
    passed: getStageCount("passed"),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-white/30" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sankey Diagram */}
      {entries.length > 0 && (
        <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white">Pipeline Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <PipelineSankey data={sankeyData} />
          </CardContent>
        </Card>
      )}

      {/* Stage summary bar */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {STAGES.map((stage) => (
          <div key={stage.id}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 min-w-fit">
            <div className={`h-2 w-2 rounded-full ${stage.color}`} />
            <span className="text-xs text-white/60">{stage.label}</span>
            <Badge variant="outline" className="text-[10px] border-white/20 text-white/50">
              {getStageCount(stage.id)}
            </Badge>
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const stageEntries = getStageEntries(stage.id);
          return (
            <div key={stage.id} className="min-w-[240px] flex-shrink-0">
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className={`h-2.5 w-2.5 rounded-full ${stage.color}`} />
                <h3 className="text-sm font-medium text-white/70">{stage.label}</h3>
                <Badge variant="outline" className="text-[10px] border-white/10 text-white/40 ml-auto">
                  {stageEntries.length}
                </Badge>
              </div>

              <ScrollArea className="h-[calc(100vh-380px)]">
                <div className="space-y-2">
                  {stageEntries.map((entry) => (
                    <Card key={entry.pipeline.id}
                      className="border-white/10 bg-white/5 backdrop-blur-sm cursor-pointer transition-all hover:bg-white/[0.08]">
                      <CardContent className="p-3">
                        <p className="text-sm font-medium text-white truncate">{entry.job.title}</p>
                        <p className="text-xs text-white/50 mt-0.5">{entry.job.company}</p>
                        <p className="text-[10px] text-white/30 mt-2">
                          {new Date(entry.pipeline.updatedAt).toLocaleDateString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                  {stageEntries.length === 0 && (
                    <div className="flex items-center justify-center h-20 rounded-lg border border-dashed border-white/10">
                      <p className="text-xs text-white/20">No jobs</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          );
        })}
      </div>
    </div>
  );
}
