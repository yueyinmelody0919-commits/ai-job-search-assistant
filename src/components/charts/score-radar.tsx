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
        borderColor="rgba(15,114,238,0.8)"
        gridLevels={5}
        gridShape="circular"
        gridLabelOffset={12}
        dotSize={6}
        dotColor="#0F72EE"
        dotBorderWidth={1}
        dotBorderColor="#FFFFFF"
        colors={["rgba(15,114,238,0.3)"]}
        fillOpacity={0.3}
        blendMode="normal"
        animate
        theme={{
          grid: {
            line: { stroke: "rgba(207,227,252,0.8)" },
          },
          axis: {
            ticks: {
              text: { fill: "#656971", fontSize: 10 },
            },
          },
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
