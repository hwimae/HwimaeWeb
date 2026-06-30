import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

async function renderShellAtPath(pathname: string, content: string) {
  vi.resetModules();
  vi.doMock("next/navigation", () => ({
    usePathname: () => pathname,
  }));

  const { FinanceShell } = await import("./finance-shell");

  return renderToStaticMarkup(
    <FinanceShell>
      <section>
        <p>{content}</p>
      </section>
    </FinanceShell>,
  );
}

describe("FinanceShell", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("renders finance routes without the duplicated intro card", async () => {
    const html = await renderShellAtPath("/finance/dashboard", "Nội dung dashboard");

    expect(html).toContain("Tài chính cá nhân");
    expect(html).toContain("Điều hướng tài chính");
    expect(html).not.toContain("Khu tài chính");
    expect(html).toContain("Nội dung dashboard");
    expect(html).not.toContain("finance-shell-layout");
  });

  it("renders a sidebar shell for the finance groups route", async () => {
    const html = await renderShellAtPath("/finance/groups", "Nội dung nhóm");

    expect(html).toContain("finance-shell-layout");
    expect(html).toContain("finance-shell-sidebar");
    expect(html).toContain("finance-shell-main");
    expect(html).toContain("finance-nav-rail");
    expect(html).toContain("Nội dung nhóm");
  });
});
