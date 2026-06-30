import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { BudgetSettingsContent } from "./budget-settings-content";

describe("BudgetSettingsContent", () => {
  it("renders formatted money inputs for loaded budget rows", () => {
    const html = renderToStaticMarkup(
      <BudgetSettingsContent
        categories={[{ id: "food", name: "Ăn uống" }]}
        drafts={{ food: 1500000 }}
        isSaving={false}
        onDraftChange={vi.fn()}
        onSubmit={(event) => event.preventDefault()}
      />,
    );

    expect(html).toContain("Cấu hình hạn mức");
    expect(html).toContain('id="budget-food"');
    expect(html).toContain('type="text"');
    expect(html).toContain('inputMode="numeric"');
    expect(html).toContain('value="1.500.000"');
    expect(html).toContain('placeholder="Ví dụ: 1.000.000"');
  });
});
