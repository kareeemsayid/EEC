import { RiskStatus, SeverityLevel, LifecycleStage } from "./types";

export function calculateBaseRisk(hours: number): RiskStatus {
  if (hours >= 16) return "Critical";
  if (hours >= 8) return "High Risk";
  return "Monitoring";
}

export function applySeverityModifier(
  baseRisk: RiskStatus,
  severity: SeverityLevel
): RiskStatus {
  if (severity === "Critical") {
    if (baseRisk === "High Risk") return "Critical";
    if (baseRisk === "Monitoring") return "High Risk";
  }
  return baseRisk;
}

export function calculateRiskStatus(
  hours: number,
  severity: SeverityLevel
): RiskStatus {
  const base = calculateBaseRisk(hours);
  return applySeverityModifier(base, severity);
}

export function inferLifecycleStage(
  riskStatus: RiskStatus,
  hours: number
): LifecycleStage {
  if (riskStatus === "Critical" && hours >= 24) return "Termination Recommended";
  if (riskStatus === "Critical") return "Final Warning";
  if (riskStatus === "High Risk") return "Coaching Plan";
  return "Initial Review";
}

export function getRiskColor(risk: RiskStatus): string {
  switch (risk) {
    case "Critical":
      return "text-red-700 bg-red-50 border-red-200";
    case "High Risk":
      return "text-amber-700 bg-amber-50 border-amber-200";
    case "Monitoring":
      return "text-teal-700 bg-teal-50 border-teal-200";
  }
}

export function getRiskDotColor(risk: RiskStatus): string {
  switch (risk) {
    case "Critical":
      return "bg-red-500";
    case "High Risk":
      return "bg-amber-500";
    case "Monitoring":
      return "bg-teal-500";
  }
}

export function getStageColor(stage: LifecycleStage): string {
  switch (stage) {
    case "Termination Recommended":
      return "text-red-700 bg-red-50";
    case "Final Warning":
      return "text-orange-700 bg-orange-50";
    case "Coaching Plan":
      return "text-amber-700 bg-amber-50";
    case "Initial Review":
      return "text-blue-700 bg-blue-50";
    case "Closed":
      return "text-gray-600 bg-gray-100";
  }
}
