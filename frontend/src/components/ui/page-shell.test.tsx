import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PageShell } from "./page-shell";

describe("PageShell", () => {
  it("renders the page shell semantic structure", () => {
    const html = renderToStaticMarkup(
      <PageShell title="Trang thử" description="Mô tả">
        <section>
          <p>Nội dung</p>
        </section>
      </PageShell>,
    );

    expect(html).toBe(
      '<main class="page-shell"><header class="page-header"><div class="section-stack"><h1>Trang thử</h1><p>Mô tả</p></div></header><section><p>Nội dung</p></section></main>',
    );
  });
});
