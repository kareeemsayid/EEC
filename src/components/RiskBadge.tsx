import React, { useState } from "react";
import { RiskStatus } from "../utils/types";

interface RiskBadgeProps {
  risk: RiskStatus;
  showTooltip?: boolean;
  size?: "sm" | "md";
}

const COLOR_MAP: Record<RiskStatus, { dot: string; pill: string }> = {
  Critical: { dot: "bg-red-500", pill: "bg-red-50 text-red-700 border-red-200" },
  "High Risk": { dot: "bg-amber-500", pill: "bg-amber-50 text-amber-700 border-amber-200" },
  Monitoring: { dot: "bg-teal-500", pill: "bg-teal-50 text-teal-700 border-teal-200" },
};

const TOOLTIP_TEXT: Record<RiskStatus, string> = {
  Monitoring: "Under 8 missed hours. Observation phase.",
  "High Risk": "8–15.99 missed hours. Coaching plan required.",
  Critical: "16+ missed hours or Critical severity. Immediate action required.",
};

export default function RiskBadge({ risk, showTooltip = true, size = "md" }: RiskBadgeProps) {
  const [hovered, setHovered] = useState(false);
  const { dot, pill } = COLOR_MAP[risk];
  const sizeClass = size === "sm" ? "text-[11px] px-2 py-0.5" : "text-xs px-2.5 py-1";

  return (
    <div className="relative inline-flex" onMouseLeave={() => setHovered(false)}>
      <span
        className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${pill} ${sizeClass} cursor-default`}
        onMouseEnter={() => setHovered(true)}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${dot} ${risk === "Critical" ? "animate-pulse" : ""}`} />
        {risk}
      </span>
      {showTooltip && hovered && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-navy-900 text-white text-xs rounded-lg px-3 py-2 shadow-glass-lg z-50 pointer-events-none animate-fade-in">
          {TOOLTIP_TEXT[risk]}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-navy-900" />
        </div>
      )}
    </div>
  );
}
