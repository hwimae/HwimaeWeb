import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { RecentTransactions } from "./recent-transaction";

describe("RecentTransactions", () => {
  it("renders recent expense entries", () => {
    const html = renderToStaticMarkup(
      <RecentTransactions
        expenses={[
          { id: "exp-1", amount: 25000, merchantName: "Highlands", spentAt: "2026-06-10T00:00:00.000Z", categoryId: "cat1" },
        ]}
        categories={[{ id: "cat1", name: "Ăn uống", icon: "🍜", color: "#ef4444" }]}
      />,
    );

    expect(html).toContain("Giao dịch gần đây");
    expect(html).toContain("Highlands");
    expect(html).toContain("Ăn uống");
  });
});
