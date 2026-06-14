import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PageShell } from "./page-shell";

describe("PageShell", () => {
  it("renders title, description, and children", () => {
    const html = renderToStaticMarkup(
      <PageShell title="Trang thử" description="Mô tả">
        <section>
          <p>Nội dung</p>
        </section>
      </PageShell>,
    );

    expect(html).toContain("Trang thử");
    expect(html).toContain("Mô tả");
    expect(html).toContain("Nội dung");
    expect(html).toContain("page-shell");
  });
});
