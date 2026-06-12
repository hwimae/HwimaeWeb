import React, { type PropsWithChildren } from "react";

type PageShellProps = PropsWithChildren<{
  title: string;
  description?: string;
}>;

export function PageShell({ title, description, children }: PageShellProps) {
  return (
    <main className="page-shell">
      <header className="page-header">
        <div className="section-stack">
          <h1>{title}</h1>
          {description ? <p>{description}</p> : null}
        </div>
      </header>
      {children}
    </main>
  );
}
