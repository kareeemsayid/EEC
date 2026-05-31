import React, { useState } from "react";
import { RiskStatus } from "../utils/types";
import { getRiskColor } from "../utils/riskLogic";

interface RiskBadgeProps {
  risk: RiskStatus;
  showTooltip?: boolean;
  size?: "sm" | "md";
}

const TOOLTIP_TEXT: Record<RiskStatus, string> = {
  Monitoring: "< 8 missed hours. Observation phase.",
  "High Risk": "8–15.99 missed hours. Coaching plan required.",
  Critical: "≥ 16 missed hours or Critical severity. Immediate action required.",
};

export default function RiskBadge({ risk, showTooltip = true, size = "md" }: RiskBadgeProps) {
  const [hovered, setHovered] = useState(false);
  const colorClass = getRiskColor(risk);
  const sizeClass = size === "sm" ? "text-xs px-2 py-0.5" : "text-xs px-2.5 py-1";

  return (
    <div className="relative inline-flex">
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-full border font-mono ${colorClass} ${sizeClass} cursor-default`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            risk === "Critical"
              ? "bg-red-500"
              : risk === "High Risk"
              ? "bg-amber-500"
              : "bg-teal-500"
          }`}
        />
        {risk}
      </span>
      {showTooltip && hovered && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-gray-900 text-white text-xs rounded px-3 py-2 shadow-lg z-50 pointer-events-none">
          {TOOLTIP_TEXT[risk]}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}
