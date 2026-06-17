"use client";

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
};

export function WorkspaceTabs({ items, ariaLabel }: WorkspaceTabsProps) {
  const pathname = usePathname();

  return (
    <nav className="workspace-nav workspace-tabs" aria-label={ariaLabel}>
      {items.map((item) => {
        const isActive = item.match
          ? item.match(pathname)
          : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Button
            key={item.href}
            as={Link}
            href={item.href}
            color="primary"
            variant={isActive ? "solid" : "flat"}
            className="workspace-nav-link"
            aria-current={isActive ? "page" : undefined}
          >
            {item.label}
          </Button>
        );
      })}
    </nav>
  );
}
