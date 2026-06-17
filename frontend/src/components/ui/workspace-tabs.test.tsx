import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/stories",
}));

import { WorkspaceTabs } from "./workspace-tabs";

describe("WorkspaceTabs", () => {
  it("renders pill tabs and marks the active href", () => {
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
  });
});
