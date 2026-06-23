import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import StoriesLoading from "./loading";

describe("StoriesLoading", () => {
  it("renders a stories-specific loading surface for the redesigned workspace", () => {
    const html = renderToStaticMarkup(<StoriesLoading />);

    expect(html).toContain("story-loading-state");
    expect(html).toContain("Đang đồng bộ khu Truyện");
  });
});
