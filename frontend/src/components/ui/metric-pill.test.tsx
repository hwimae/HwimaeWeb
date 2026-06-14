import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { MetricPill } from "./metric-pill";

describe("MetricPill", () => {
  it("renders label and value", () => {
    const html = renderToStaticMarkup(<MetricPill label="Rating" value="4.8" />);

    expect(html).toContain("Rating");
    expect(html).toContain("4.8");
  });
});
