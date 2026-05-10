"use client";

import { ResponsiveSankey } from "@nivo/sankey";

interface PipelineSankeyProps {
  data?: {
    discovered: number;
    queued: number;
    outreached: number;
    applied: number;
    interviewing: number;
    offer: number;
    passed: number;
  };
}

export function PipelineSankey({ data }: PipelineSankeyProps) {
  const counts = data || {
    discovered: 0,
    queued: 0,
    outreached: 0,
    applied: 0,
    interviewing: 0,
    offer: 0,
    passed: 0,
  };

  // Don't render if no data
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-white/20 text-sm">
        No pipeline data yet. Scan and score jobs to see the flow.
      </div>
    );
  }

  const sankeyData = {
    nodes: [
      { id: "Discovered", color: "rgb(107,114,128)" },
      { id: "Queued", color: "rgb(59,130,246)" },
      { id: "Outreached", color: "rgb(168,85,247)" },
      { id: "Applied", color: "rgb(245,158,11)" },
      { id: "Interviewing", color: "rgb(34,197,94)" },
      { id: "Offer", color: "rgb(16,185,129)" },
      { id: "Passed", color: "rgb(239,68,68)" },
    ],
    links: [
      { source: "Discovered", target: "Queued", value: Math.max(counts.queued, 1) },
      { source: "Discovered", target: "Passed", value: Math.max(counts.passed, 1) },
      { source: "Queued", target: "Outreached", value: Math.max(counts.outreached, 1) },
      { source: "Outreached", target: "Applied", value: Math.max(counts.applied, 1) },
      { source: "Applied", target: "Interviewing", value: Math.max(counts.interviewing, 1) },
      { source: "Interviewing", target: "Offer", value: Math.max(counts.offer || 1, 1) },
    ],
  };

  return (
    <div className="h-[200px]">
      <ResponsiveSankey
        data={sankeyData}
        margin={{ top: 10, right: 40, bottom: 10, left: 40 }}
        align="justify"
        colors={(node) => {
          const colorMap: Record<string, string> = {
            Discovered: "rgba(107,114,128,0.6)",
            Queued: "rgba(59,130,246,0.6)",
            Outreached: "rgba(168,85,247,0.6)",
            Applied: "rgba(245,158,11,0.6)",
            Interviewing: "rgba(34,197,94,0.6)",
            Offer: "rgba(16,185,129,0.6)",
            Passed: "rgba(239,68,68,0.6)",
          };
          return colorMap[node.id as string] || "rgba(255,255,255,0.3)";
        }}
        nodeOpacity={1}
        nodeThickness={14}
        nodeInnerPadding={2}
        nodeBorderWidth={0}
        nodeBorderRadius={3}
        linkOpacity={0.3}
        linkHoverOpacity={0.5}
        linkBlendMode="normal"
        enableLinkGradient
        labelPosition="outside"
        labelOrientation="horizontal"
        labelPadding={8}
        labelTextColor="rgba(255,255,255,0.5)"
        theme={{
          labels: { text: { fontSize: 11, fill: "rgba(255,255,255,0.5)" } },
          tooltip: {
            container: {
              background: "rgba(0,0,0,0.85)",
              color: "white",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.1)",
              fontSize: "12px",
            },
          },
        }}
      />
    </div>
  );
}
