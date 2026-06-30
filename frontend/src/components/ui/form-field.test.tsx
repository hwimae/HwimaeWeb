import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FormField } from "./form-field";

describe("FormField", () => {
  it("adds shared slot classes so input fields can receive project focus styling", () => {
    const html = renderToStaticMarkup(
      <FormField id="email" name="email" type="email" label="Email" defaultValue="" />,
    );

    expect(html).toContain("form-field-input-wrapper");
    expect(html).toContain("form-field-input-element");
    expect(html).toContain("form-field-label");
  });

  it("adds the same shared slot classes for textarea fields", () => {
    const html = renderToStaticMarkup(
      <FormField id="notes" name="notes" kind="textarea" label="Ghi chú" defaultValue="" />,
    );

    expect(html).toContain("form-field-input-wrapper");
    expect(html).toContain("form-field-input-element");
    expect(html).toContain("form-field-label");
  });
});
