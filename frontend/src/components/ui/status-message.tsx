import React, { type HTMLAttributes, type ReactNode } from "react";

type StatusTone = "info" | "error" | "success";

type StatusMessageProps = Omit<HTMLAttributes<HTMLDivElement>, "role"> & {
  tone?: StatusTone;
  children: ReactNode;
};

export function StatusMessage({
  tone = "info",
  className,
  children,
  ...props
}: StatusMessageProps) {
  const role = tone === "error" ? "alert" : "status";
  const classes = ["status-message", `status-message-${tone}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <div {...props} className={classes} role={role}>
      {children}
    </div>
  );
}
