import React, { type ReactNode } from "react";

type LandingHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions: ReactNode;
  preview: ReactNode;
};

export function LandingHero({ eyebrow, title, description, actions, preview }: LandingHeroProps) {
  return (
    <section className="landing-hero-surface landing-hero">
      <div className="section-stack landing-hero-copy">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
        <div className="form-actions landing-hero-actions">{actions}</div>
      </div>
      <div className="landing-hero-preview">{preview}</div>
    </section>
  );
}
