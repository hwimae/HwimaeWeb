"use client";

import React from "react";

import { WorkspaceTabs } from "../ui/workspace-tabs";

const STORY_NAV_ITEMS = [
  {
    href: "/stories",
    label: "Danh sách truyện",
    match: (pathname: string) => pathname === "/stories" || pathname.startsWith("/stories/"),
  },
  { href: "/recommendations", label: "AI tư vấn" },
] as const;

export function StoryWorkspaceNav() {
  return <WorkspaceTabs ariaLabel="Điều hướng khu truyện" items={[...STORY_NAV_ITEMS]} />;
}
