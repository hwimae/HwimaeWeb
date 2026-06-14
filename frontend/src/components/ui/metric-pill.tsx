import { Chip } from "@heroui/react";
import React from "react";

type MetricPillProps = {
  label: string;
  value: string;
  tone?: "primary" | "success" | "warning" | "default";
};

const TONE_TO_COLOR = {
  primary: "primary",
  success: "success",
  warning: "warning",
  default: "default",
} as const;

export function MetricPill({ label, value, tone = "primary" }: MetricPillProps) {
  return (
    <Chip color={TONE_TO_COLOR[tone]} variant="flat" className="metric-pill">
      <span className="metric-pill-label">{label}</span>
      <strong>{value}</strong>
    </Chip>
  );
}
