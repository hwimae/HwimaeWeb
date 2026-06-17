import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

let mockedPathname = "/stories";

vi.mock("next/navigation", () => ({
  usePathname: () => mockedPathname,
}));

import { StoryWorkspaceNav } from "./story-workspace-nav";

describe("StoryWorkspaceNav", () => {
  beforeEach(() => {
    mockedPathname = "/stories";
  });

  it("renders story workspace links", () => {
    const html = renderToStaticMarkup(<StoryWorkspaceNav />);

    expect(html).toContain('href="/stories"');
    expect(html).toContain('href="/recommendations"');
    expect(html).toContain("Danh sách truyện");
    expect(html).toContain("AI tư vấn");
    expect(html).toContain('aria-current="page"');
  });

  it("marks recommendations active", () => {
    mockedPathname = "/recommendations";

    const html = renderToStaticMarkup(<StoryWorkspaceNav />);

    expect(html).toContain('aria-current="page"');
    expect(html).toContain("AI tư vấn");
  });

  it("keeps the story list tab active on detail pages", () => {
    mockedPathname = "/stories/abc";

    const html = renderToStaticMarkup(<StoryWorkspaceNav />);

    expect(html).toContain('href="/stories"');
    expect(html).toContain('aria-current="page"');
  });
});
