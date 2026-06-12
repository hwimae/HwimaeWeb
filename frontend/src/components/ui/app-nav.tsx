"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type AppNavItem = {
  href: string;
  label: string;
};

type AppNavProps = {
  items: AppNavItem[];
  ariaLabel?: string;
};

export function AppNav({
  items,
  ariaLabel = "Điều hướng chính",
}: AppNavProps) {
  const pathname = usePathname();

  return (
    <nav className="app-nav" aria-label={ariaLabel}>
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link key={item.href} href={item.href} aria-current={isActive ? "page" : undefined}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
