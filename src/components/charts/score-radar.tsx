"use client";

import { ResponsiveRadar } from "@nivo/radar";

interface ScoreRadarProps {
  scores: Record<string, number>;
}

const dimensionLabels: Record<string, string> = {
  title_seniority: "Title",
  function_alignment: "Function",
  company_stage: "Stage",
  ai_native: "AI Culture",
  location: "Location",
  reporting_line: "Reports To",
  comp_signal: "Comp",
  industry: "Industry",
  growth_trajectory: "Growth",
};

export function ScoreRadar({ scores }: ScoreRadarProps) {
  const data = Object.entries(scores).map(([key, value]) => ({
    dimension: dimensionLabels[key] || key,
    score: value,
  }));

  return (
    <div className="h-[250px]">
      <ResponsiveRadar
        data={data}
        keys={["score"]}
        indexBy="dimension"
        maxValue={5}
        margin={{ top: 30, right: 60, bottom: 30, left: 60 }}
        curve="linearClosed"
        borderWidth={2}
        borderColor="rgba(59,130,246,0.8)"
        gridLevels={5}
        gridShape="circular"
        gridLabelOffset={12}
        dotSize={6}
        dotColor="rgba(59,130,246,1)"
        dotBorderWidth={1}
        dotBorderColor="rgba(255,255,255,0.3)"
        colors={["rgba(59,130,246,0.4)"]}
        fillOpacity={0.3}
        blendMode="normal"
        animate
        theme={{
          grid: {
            line: { stroke: "rgba(255,255,255,0.08)" },
          },
          axis: {
            ticks: {
              text: { fill: "rgba(255,255,255,0.4)", fontSize: 10 },
            },
          },
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
