import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { StatusMessage } from "./status-message";

describe("StatusMessage", () => {
  it("renders default messages with status role and info class", () => {
    const html = renderToStaticMarkup(<StatusMessage>Đang tải dữ liệu</StatusMessage>);

    expect(html).toContain('role="status"');
    expect(html).toContain("status-message-info");
    expect(html).toContain("Đang tải dữ liệu");
  });

  it("renders error messages with alert role", () => {
    const html = renderToStaticMarkup(<StatusMessage tone="error">Không thể tải dữ liệu</StatusMessage>);

    expect(html).toContain('role="alert"');
    expect(html).toContain("status-message-error");
    expect(html).toContain("Không thể tải dữ liệu");
  });

  it("keeps caller classes while preserving the status message contract", () => {
    const html = renderToStaticMarkup(
      <StatusMessage tone="success" className="custom-tone">
        Hoàn tất
      </StatusMessage>,
    );

    expect(html).toContain("status-message-success");
    expect(html).toContain("custom-tone");
    expect(html).toContain("Hoàn tất");
  });
});
