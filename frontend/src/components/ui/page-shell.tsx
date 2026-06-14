import React, { type PropsWithChildren, type ReactNode } from "react";

type PageShellProps = PropsWithChildren<{
  title: string;
  description?: string;
  actions?: ReactNode;
}>;

export function PageShell({ title, description, actions, children }: PageShellProps) {
  return (
    <main className="page-shell">
      <header className="page-header hero-panel">
        <div className="section-stack">
          <p className="eyebrow">Story Recommendation</p>
          <h1>{title}</h1>
          {description ? <p>{description}</p> : null}
        </div>
        {actions ? <div className="page-header-actions">{actions}</div> : null}
      </header>
      {children}
    </main>
  );
}
