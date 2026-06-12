"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const MODULE_LINKS = [
  { href: "/finance", label: "Tài chính" },
  { href: "/stories", label: "Truyện" },
  { href: "/movie", label: "Phim" },
] as const;

const STORY_PATH_PREFIXES = ["/stories", "/recommendations", "/login", "/register"];

function isModuleActive(pathname: string, href: string): boolean {
  if (href === "/stories") {
    return STORY_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function GlobalHeader() {
  const pathname = usePathname();

  return (
    <header className="global-header">
      <div className="global-header-inner">
        <nav className="global-header-nav" aria-label="Điều hướng khu vực">
          {MODULE_LINKS.map((item) => {
            const isActive = isModuleActive(pathname, item.href);

            return (
              <Link key={item.href} href={item.href} aria-current={isActive ? "page" : undefined}>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
