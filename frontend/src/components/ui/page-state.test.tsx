import React from "react";
import Link from "next/link";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PageState } from "./page-state";

describe("PageState", () => {
  it("renders a reusable loading panel", () => {
    const html = renderToStaticMarkup(
      <PageState tone="loading" title="Đang tải truyện" description="Đang chuẩn bị dữ liệu hiển thị." />,
    );

    expect(html).toContain("Đang tải truyện");
    expect(html).toContain("page-state");
    expect(html).toContain("page-state-loading");
  });

  it("renders an empty state with a CTA slot", () => {
    const html = renderToStaticMarkup(
      <PageState tone="empty" title="Chưa có gợi ý" description="Hãy thử thêm review hoặc đổi bộ lọc." cta={<Link href="/stories">Quay lại truyện</Link>} />,
    );

    expect(html).toContain("Chưa có gợi ý");
    expect(html).toContain('href="/stories"');
    expect(html).toContain("page-state-empty");
  });

  it("renders an info state with supporting actions", () => {
    const html = renderToStaticMarkup(
      <PageState
        tone="info"
        title="Không có tài khoản đang chờ duyệt"
        description="Khi có người dùng mới đăng ký, tài khoản sẽ xuất hiện tại đây."
        cta={<Link href="/register">Mời người dùng đăng ký</Link>}
      />,
    );

    expect(html).toContain("Không có tài khoản đang chờ duyệt");
    expect(html).toContain('href="/register"');
  });
});
