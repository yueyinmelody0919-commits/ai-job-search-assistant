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
    discovered: 0, queued: 0, outreached: 0, applied: 0,
    interviewing: 0, offer: 0, passed: 0,
  };

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-dim text-sm">
        No pipeline data yet. Scan and score jobs to see the flow.
      </div>
    );
  }

  const sankeyData = {
    nodes: [
      { id: "Discovered", color: "#656971" },
      { id: "Queued", color: "#0F72EE" },
      { id: "Outreached", color: "#7236D3" },
      { id: "Applied", color: "#F59E0B" },
      { id: "Interviewing", color: "#10B981" },
      { id: "Offer", color: "#059669" },
      { id: "Passed", color: "#D94444" },
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
            Discovered: "rgba(101,105,113,0.7)",
            Queued: "rgba(15,114,238,0.7)",
            Outreached: "rgba(114,54,211,0.7)",
            Applied: "rgba(245,158,11,0.7)",
            Interviewing: "rgba(16,185,129,0.7)",
            Offer: "rgba(5,150,105,0.7)",
            Passed: "rgba(217,68,68,0.7)",
          };
          return colorMap[node.id as string] || "rgba(101,105,113,0.4)";
        }}
        nodeOpacity={1}
        nodeThickness={14}
        nodeInnerPadding={2}
        nodeBorderWidth={0}
        nodeBorderRadius={3}
        linkOpacity={0.2}
        linkHoverOpacity={0.4}
        linkBlendMode="normal"
        enableLinkGradient
        labelPosition="outside"
        labelOrientation="horizontal"
        labelPadding={8}
        labelTextColor="#32363E"
        theme={{
          labels: { text: { fontSize: 11, fill: "#32363E" } },
          tooltip: {
            container: {
              background: "#FFFFFF",
              color: "#191B1F",
              borderRadius: "12px",
              border: "1px solid #CFE3FC",
              fontSize: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            },
          },
        }}
      />
    </div>
  );
}
