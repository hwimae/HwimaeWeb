import clsx from "clsx";
import React, { type PropsWithChildren, type ReactNode } from "react";

type PageShellProps = PropsWithChildren<{
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  heroAside?: ReactNode;
  variant?: "default" | "workspace";
}>;

export function PageShell({
  title,
  description,
  eyebrow = "Story Recommendation",
  actions,
  heroAside,
  variant = "default",
  children,
}: PageShellProps) {
  return (
    <main className={clsx("page-shell", variant === "workspace" && "page-shell-workspace")}>
      <header className={clsx("page-header", "page-header-compact", variant === "workspace" && "page-header-workspace")}>
        <div className="section-stack page-header-copy">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          {description ? <p className="page-header-description">{description}</p> : null}
          {actions ? <div className="page-header-actions">{actions}</div> : null}
        </div>
        {heroAside ? <div className="page-header-aside">{heroAside}</div> : null}
      </header>
      {children}
    </main>
  );
}
