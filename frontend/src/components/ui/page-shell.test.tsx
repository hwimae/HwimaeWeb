import NextLink from "next/link";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PageShell } from "./page-shell";

describe("PageShell", () => {
  it("renders title, description, eyebrow, actions, and children", () => {
    const html = renderToStaticMarkup(
      <PageShell
        title="Trang thử"
        description="Mô tả"
        eyebrow="Workspace"
        actions={<NextLink href="/stories">Mở truyện</NextLink>}
      >
        <section>
          <p>Nội dung</p>
        </section>
      </PageShell>,
    );

    expect(html).toContain("Trang thử");
    expect(html).toContain("Mô tả");
    expect(html).toContain("Workspace");
    expect(html).toContain('href="/stories"');
    expect(html).toContain("Nội dung");
    expect(html).toContain("page-shell");
    expect(html).toContain("page-header-actions");
  });

  it("renders the workspace variant without the old hero-panel class", () => {
    const html = renderToStaticMarkup(
      <PageShell title="Tài chính" description="Theo dõi dòng tiền" variant="workspace">
        <p>Dashboard</p>
      </PageShell>,
    );

    expect(html).toContain("page-shell-workspace");
    expect(html).toContain("page-header page-header-compact");
    expect(html).not.toContain("hero-panel");
  });
});
