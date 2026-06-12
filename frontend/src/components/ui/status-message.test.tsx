import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { StatusMessage } from "./status-message";

describe("StatusMessage", () => {
  it("renders default messages with status role and info class", () => {
    const html = renderToStaticMarkup(
      <StatusMessage>Đang tải dữ liệu</StatusMessage>,
    );

    expect(html).toBe(
      '<div class="status-message status-message-info" role="status">Đang tải dữ liệu</div>',
    );
  });

  it("renders error messages with alert role", () => {
    const html = renderToStaticMarkup(
      <StatusMessage tone="error">Không thể tải dữ liệu</StatusMessage>,
    );

    expect(html).toBe(
      '<div class="status-message status-message-error" role="alert">Không thể tải dữ liệu</div>',
    );
  });

  it("keeps caller classes while preserving the status message contract", () => {
    const html = renderToStaticMarkup(
      <StatusMessage tone="success" className="custom-tone">
        Hoàn tất
      </StatusMessage>,
    );

    expect(html).toBe(
      '<div class="status-message status-message-success custom-tone" role="status">Hoàn tất</div>',
    );
  });
});
