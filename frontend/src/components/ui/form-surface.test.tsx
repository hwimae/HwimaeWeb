import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FormSurface } from "./form-surface";

describe("FormSurface", () => {
  it("renders the shared wrapper classes and forwards root/body props", () => {
    const html = renderToStaticMarkup(
      <FormSurface className="example-surface" bodyClassName="example-body" id="auth-surface" aria-label="Auth form">
        <form>
          <label htmlFor="email">Email</label>
          <input id="email" />
        </form>
      </FormSurface>,
    );

    expect(html).toContain("form-surface");
    expect(html).toContain("form-surface-body");
    expect(html).toContain("example-surface");
    expect(html).toContain("example-body");
    expect(html).toContain('id="auth-surface"');
    expect(html).toContain('aria-label="Auth form"');
    expect(html).toContain("Email");
  });
});
