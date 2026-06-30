"use client";

import React from "react";
import { Button } from "@heroui/react";
import { BookOpenText, Sparkles, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type StoryNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  match?: (pathname: string) => boolean;
};

const STORY_NAV_ITEMS: StoryNavItem[] = [
  {
    href: "/stories",
    label: "Danh sách truyện",
    icon: BookOpenText,
    match: (pathname: string) => pathname === "/stories" || pathname.startsWith("/stories/"),
  },
  { href: "/recommendations", label: "AI tư vấn", icon: Sparkles },
] as const;

export function StoryWorkspaceNav() {
  const pathname = usePathname();

  return (
    <>
      <aside className="story-workspace-nav-sidebar" aria-label="Điều hướng khu truyện">
        <div className="story-workspace-nav-header">
          <h2>Truyện</h2>
          <p>Sáng tác &amp; Khám phá</p>
        </div>

        <nav className="story-workspace-nav-list">
          {STORY_NAV_ITEMS.map(({ href, label, icon: Icon, match }) => {
            const isActive = match ? match(pathname) : pathname === href || pathname.startsWith(`${href}/`);

            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={isActive ? "story-workspace-nav-link is-active" : "story-workspace-nav-link"}
              >
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <nav className="story-workspace-nav-mobile workspace-nav workspace-tabs" aria-label="Điều hướng khu truyện trên di động">
        {STORY_NAV_ITEMS.map(({ href, label, match }) => {
          const isActive = match ? match(pathname) : pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Button
              key={href}
              as={Link}
              href={href}
              variant="light"
              className={isActive ? "workspace-nav-link workspace-nav-link-active" : "workspace-nav-link"}
              aria-current={isActive ? "page" : undefined}
            >
              {label}
            </Button>
          );
        })}
      </nav>
    </>
  );
}
