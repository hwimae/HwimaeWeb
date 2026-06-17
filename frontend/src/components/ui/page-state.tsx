import React, { type ReactNode } from "react";

type PageStateTone = "loading" | "empty" | "info";

type PageStateProps = {
  tone: PageStateTone;
  title: string;
  description: string;
  cta?: ReactNode;
};

const EYEBROW_BY_TONE: Record<PageStateTone, string> = {
  loading: "Loading",
  empty: "Empty state",
  info: "Thông tin",
};

export function PageState({ tone, title, description, cta }: PageStateProps) {
  return (
    <section className={`page-state page-state-${tone} section-stack`}>
      <p className="eyebrow">{EYEBROW_BY_TONE[tone]}</p>
      <h2>{title}</h2>
      <p className="result-summary">{description}</p>
      {cta ? <div className="form-actions">{cta}</div> : null}
      {tone === "loading" ? (
        <div className="loading-grid" aria-hidden="true">
          <div className="skeleton-card" />
          <div className="skeleton-card" />
          <div className="skeleton-card" />
        </div>
      ) : null}
    </section>
  );
}
