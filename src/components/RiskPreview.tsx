import React from "react";
import { SeverityLevel, RiskStatus } from "../utils/types";
import { calculateRiskStatus } from "../utils/riskLogic";
import RiskBadge from "./RiskBadge";

interface RiskPreviewProps {
  hours: number;
  severity: SeverityLevel;
}

export default function RiskPreview({ hours, severity }: RiskPreviewProps) {
  const risk: RiskStatus = calculateRiskStatus(hours, severity);

  const thresholds = [
    { label: "Monitoring", range: "< 8h", color: "bg-teal-500" },
    { label: "High Risk", range: "8–15.99h", color: "bg-amber-500" },
    { label: "Critical", range: "≥ 16h", color: "bg-red-500" },
  ];

  const barWidth = Math.min((hours / 24) * 100, 100);

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Live Risk Assessment</span>
        <RiskBadge risk={risk} />
      </div>

      {/* Hours bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>0h</span>
          <span className="font-mono font-bold text-gray-700">{hours}h missed</span>
          <span>24h+</span>
        </div>
        <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              risk === "Critical"
                ? "bg-red-500"
                : risk === "High Risk"
                ? "bg-amber-500"
                : "bg-teal-500"
            }`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
        <div className="flex mt-1 gap-0.5">
          {thresholds.map((t) => (
            <div key={t.label} className="flex items-center gap-1 mr-3">
              <div className={`w-1.5 h-1.5 rounded-full ${t.color}`} />
              <span className="text-xs text-gray-500">{t.label} ({t.range})</span>
            </div>
          ))}
        </div>
      </div>

      {severity === "Critical" && (
        <p className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
          ⚠ Critical severity modifier applied — risk escalated one level
        </p>
      )}
    </div>
  );
}
