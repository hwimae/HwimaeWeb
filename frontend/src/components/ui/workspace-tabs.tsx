"use client";

import clsx from "clsx";
import React from "react";
import { Button } from "@heroui/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type WorkspaceTabItem = {
  href: string;
  label: string;
  match?: (pathname: string) => boolean;
};

type WorkspaceTabsProps = {
  items: WorkspaceTabItem[];
  ariaLabel: string;
  orientation?: "horizontal" | "vertical";
  className?: string;
};

export function WorkspaceTabs({
  items,
  ariaLabel,
  orientation = "horizontal",
  className,
}: WorkspaceTabsProps) {
  const pathname = usePathname();

  return (
    <nav
      className={clsx(
        "workspace-nav workspace-tabs",
        orientation === "vertical" ? "workspace-tabs-vertical" : "workspace-tabs-horizontal",
        className,
      )}
      aria-label={ariaLabel}
    >
      {items.map((item) => {
        const isActive = item.match
          ? item.match(pathname)
          : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Button
            key={item.href}
            as={Link}
            href={item.href}
            variant="light"
            className={clsx("workspace-nav-link", isActive && "workspace-nav-link-active")}
            aria-current={isActive ? "page" : undefined}
          >
            {item.label}
          </Button>
        );
      })}
    </nav>
  );
}
