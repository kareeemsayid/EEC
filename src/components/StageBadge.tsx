import React from "react";
import { LifecycleStage } from "../utils/types";
import { getStageColor } from "../utils/riskLogic";

interface StageBadgeProps {
  stage: LifecycleStage;
  size?: "sm" | "md";
}

export default function StageBadge({ stage, size = "md" }: StageBadgeProps) {
  const colorClass = getStageColor(stage);
  const sizeClass = size === "sm" ? "text-xs px-2 py-0.5" : "text-xs px-2.5 py-1";
  return (
    <span className={`inline-block font-medium rounded-full ${colorClass} ${sizeClass}`}>
      {stage}
    </span>
  );
}
