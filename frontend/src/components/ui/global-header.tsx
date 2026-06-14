"use client";

import {
  Button,
  Link as HeroLink,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from "@heroui/react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

import { useAuth } from "@/components/auth/auth-context";

const MODULE_LINKS = [
  { href: "/finance/dashboard", label: "Tài chính" },
  { href: "/stories", label: "Truyện" },
  { href: "/movie", label: "Phim" },
] as const;

const STORY_PATH_PREFIXES = ["/stories", "/recommendations", "/login", "/register"];

function isModuleActive(pathname: string, href: string): boolean {
  if (href === "/finance/dashboard") {
    return pathname === "/finance" || pathname.startsWith("/finance/");
  }

  if (href === "/stories") {
    return STORY_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function GlobalHeader() {
  const pathname = usePathname();
  const { user, isCheckingAuth, logout } = useAuth();
  const links =
    user?.role === "ADMIN" && user.status === "APPROVED"
      ? [...MODULE_LINKS, { href: "/admin/users", label: "Admin" }]
      : MODULE_LINKS;

  return (
    <Navbar className="global-header" maxWidth="xl" isBordered>
      <NavbarBrand>
        <HeroLink as={NextLink} href="/" color="foreground" className="global-header-brand">
          StoryRec
        </HeroLink>
      </NavbarBrand>
      <NavbarContent justify="end" className="global-header-nav">
        {links.map((item) => {
          const isActive = isModuleActive(pathname, item.href);

          return (
            <NavbarItem key={item.href} isActive={isActive}>
              <HeroLink
                as={NextLink}
                href={item.href}
                color={isActive ? "primary" : "foreground"}
                aria-current={isActive ? "page" : undefined}
                className="global-header-link"
              >
                {item.label}
              </HeroLink>
            </NavbarItem>
          );
        })}
        {!isCheckingAuth && (
          user ? (
            <NavbarItem>
              <Button color="primary" variant="flat" className="global-header-link" onPress={logout}>
                Logout
              </Button>
            </NavbarItem>
          ) : (
            <>
              <NavbarItem>
                <Button as={NextLink} href="/login" color="primary" variant="flat" className="global-header-link">
                  Login
                </Button>
              </NavbarItem>
              <NavbarItem>
                <Button as={NextLink} href="/register" color="primary" className="global-header-link">
                  Register
                </Button>
              </NavbarItem>
            </>
          )
        )}
      </NavbarContent>
    </Navbar>
  );
}
