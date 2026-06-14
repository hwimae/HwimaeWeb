import { Card, CardBody } from "@heroui/react";
import React, { type HTMLAttributes, type ReactNode } from "react";

type StatusTone = "info" | "error" | "success";

type StatusMessageProps = Omit<HTMLAttributes<HTMLDivElement>, "role"> & {
  tone?: StatusTone;
  children: ReactNode;
};

const TONE_LABEL: Record<StatusTone, string> = {
  info: "Thông tin",
  error: "Lỗi",
  success: "Thành công",
};

export function StatusMessage({
  tone = "info",
  className,
  children,
  ...props
}: StatusMessageProps) {
  const role = tone === "error" ? "alert" : "status";
  const classes = ["status-message", `status-message-${tone}`, className].filter(Boolean).join(" ");

  return (
    <div {...props} className={classes} role={role}>
      <Card shadow="none" className="status-message-card">
        <CardBody>
          <strong className="status-message-label">{TONE_LABEL[tone]}:</strong> {children}
        </CardBody>
      </Card>
    </div>
  );
}
