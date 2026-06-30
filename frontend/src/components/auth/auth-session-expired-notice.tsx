import React from "react";

import { AUTH_SESSION_EXPIRED_MESSAGE } from "./auth-gate-policy";
import { StatusMessage } from "../ui/status-message";

type AuthSessionExpiredNoticeProps = {
  message?: string;
};

export function AuthSessionExpiredNotice({
  message = AUTH_SESSION_EXPIRED_MESSAGE,
}: AuthSessionExpiredNoticeProps) {
  return (
    <main className="page-shell">
      <StatusMessage tone="error">{message}</StatusMessage>
    </main>
  );
}
