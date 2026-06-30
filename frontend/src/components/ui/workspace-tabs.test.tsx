import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/stories",
}));

import { WorkspaceTabs } from "./workspace-tabs";

describe("WorkspaceTabs", () => {
  it("marks the active tab with aria-current without depending on HeroUI solid colors", () => {
    const html = renderToStaticMarkup(
      <WorkspaceTabs
        ariaLabel="Điều hướng khu truyện"
        items={[
          { href: "/stories", label: "Danh sách truyện" },
          { href: "/recommendations", label: "AI tư vấn" },
        ]}
      />,
    );

    expect(html).toContain('aria-label="Điều hướng khu truyện"');
    expect(html).toContain('href="/stories"');
    expect(html).toContain('href="/recommendations"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain("workspace-nav-link");
    expect(html).not.toContain("color=\"primary\"");
  });

  it("renders a vertical workspace tab rail when requested", () => {
    const html = renderToStaticMarkup(
      <WorkspaceTabs
        ariaLabel="Điều hướng dọc"
        orientation="vertical"
        className="finance-nav-rail"
        items={[
          { href: "/finance/dashboard", label: "Dashboard" },
          { href: "/finance/groups", label: "Nhóm" },
        ]}
      />,
    );

    expect(html).toContain('aria-label="Điều hướng dọc"');
    expect(html).toContain("workspace-tabs-vertical");
    expect(html).toContain("finance-nav-rail");
  });
});
