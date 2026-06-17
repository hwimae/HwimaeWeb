import NextLink from "next/link";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LandingHero } from "./landing-hero";

describe("LandingHero", () => {
  it("renders headline, preview content, and CTA area", () => {
    const html = renderToStaticMarkup(
      <LandingHero
        eyebrow="StoryRec"
        title="Không gian kể chuyện & quản lý tài chính thông minh."
        description="Tổ chức công việc sáng tạo và theo dõi chi tiêu trong một giao diện duy nhất."
        actions={<NextLink href="/stories">Khám phá truyện</NextLink>}
        preview={<section><h2>Workspace hôm nay</h2></section>}
      />,
    );

    expect(html).toContain("Không gian kể chuyện &amp; quản lý tài chính thông minh.");
    expect(html).toContain('href="/stories"');
    expect(html).toContain("Workspace hôm nay");
    expect(html).toContain("landing-hero-surface");
  });

  it("renders multiple CTA actions for the home entry surface", () => {
    const html = renderToStaticMarkup(
      <LandingHero
        eyebrow="Nền tảng cá nhân của boo"
        title="Không gian kể chuyện & quản lý tài chính thông minh."
        description="Tổ chức công việc sáng tạo, theo dõi chi tiêu và khám phá nội dung giải trí trong một không gian duy nhất."
        actions={
          <>
            <NextLink href="/stories">Khám phá truyện</NextLink>
            <NextLink href="/finance/dashboard">Xem tài chính</NextLink>
          </>
        }
        preview={<section><p>Workspace hôm nay</p></section>}
      />,
    );

    expect(html).toContain('href="/stories"');
    expect(html).toContain('href="/finance/dashboard"');
  });
});
