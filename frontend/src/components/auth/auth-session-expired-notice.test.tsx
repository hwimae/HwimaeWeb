import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AUTH_SESSION_EXPIRED_MESSAGE } from "./auth-gate-policy";
import { AuthSessionExpiredNotice } from "./auth-session-expired-notice";

describe("AuthSessionExpiredNotice", () => {
  it("renders the scoped auth-expired message inside the shared status shell", () => {
    const html = renderToStaticMarkup(<AuthSessionExpiredNotice />);

    expect(html).toContain(AUTH_SESSION_EXPIRED_MESSAGE);
    expect(html).toContain("status-message-error");
    expect(html).toContain("page-shell");
  });
});
