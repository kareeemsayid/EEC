import React from "react";
import { LifecycleStage } from "../utils/types";

interface StageBadgeProps {
  stage: LifecycleStage;
  size?: "sm" | "md";
}

const COLOR_MAP: Record<LifecycleStage, string> = {
  "Termination Recommended": "text-red-700 bg-red-50 border-red-200",
  "Workday Action Pending": "text-red-700 bg-red-50 border-red-200",
  "Terminated": "text-red-700 bg-red-50 border-red-200",
  "Critical Escalation": "text-orange-700 bg-orange-50 border-orange-200",
  "High Risk": "text-amber-700 bg-amber-50 border-amber-200",
  "PS Review": "text-amber-700 bg-amber-50 border-amber-200",
  "Under Review": "text-blue-700 bg-blue-50 border-blue-200",
  "Exit Coordination": "text-teal-700 bg-teal-50 border-teal-200",
  "Monitoring": "text-teal-700 bg-teal-50 border-teal-200",
  "Closed": "text-gray-600 bg-gray-100 border-gray-200",
};

export default function StageBadge({ stage, size = "md" }: StageBadgeProps) {
  const colorClass = COLOR_MAP[stage] || "text-gray-600 bg-gray-100 border-gray-200";
  const sizeClass = size === "sm" ? "text-[11px] px-2 py-0.5" : "text-xs px-2.5 py-1";
  return (
    <span className={`inline-block font-semibold rounded-full border ${colorClass} ${sizeClass}`}>
      {stage}
    </span>
  );
}
