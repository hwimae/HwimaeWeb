import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FinanceGroupDetailView } from "./finance-group-detail";
import { FinanceGroupsPanel } from "./finance-groups-panel";
import { FinanceMemberDashboard } from "./finance-member-dashboard";
import { FinanceMemberSelector } from "./finance-member-selector";

const group = {
  id: "group-1",
  name: "Gia đình",
  ownerId: "user-1",
  currentUserRole: "OWNER" as const,
  memberCount: 2,
  createdAt: "2026-06-14T00:00:00.000Z",
  updatedAt: "2026-06-14T00:00:00.000Z",
  members: [
    { userId: "user-1", name: "Boo", email: "boo@example.com", role: "OWNER" as const, joinedAt: "2026-06-14T00:00:00.000Z" },
    { userId: "user-2", name: "An", email: "an@example.com", role: "MEMBER" as const, joinedAt: "2026-06-14T00:00:00.000Z" },
  ],
};

const dashboard = {
  member: { userId: "user-2", name: "An", email: "an@example.com" },
  categories: [{ id: "cat-1", name: "Ăn uống" }],
  budgets: [{ id: "budget-1", categoryId: "cat-1", limitAmount: 1000000, period: "monthly" as const, alertThreshold: 0.8, category: { id: "cat-1", name: "Ăn uống" } }],
  expenses: [{ id: "expense-1", amount: 25000, merchantName: "Highlands", spentAt: "2026-06-14T00:00:00.000Z", categoryId: "cat-1", category: { id: "cat-1", name: "Ăn uống" } }],
  summary: { totalAmount: 25000, categories: [{ categoryId: "cat-1", categoryName: "Ăn uống", amount: 25000 }] },
};

describe("Finance Groups UI", () => {
  it("renders empty groups panel", () => {
    const html = renderToStaticMarkup(<FinanceGroupsPanel groups={[]} selectedGroupId={null} isLoading={false} onSelectGroup={() => undefined} onCreateGroup={() => true} />);

    expect(html).toContain("Bạn chưa tham gia nhóm tài chính nào");
    expect(html).toContain("Tạo nhóm đầu tiên");
  });

  it("renders member names as selector buttons", () => {
    const html = renderToStaticMarkup(<FinanceMemberSelector members={group.members} selectedMemberUserId="user-2" onSelectMember={() => undefined} />);

    expect(html).toContain("Boo");
    expect(html).toContain("An");
  });

  it("shows owner-only controls for owner", () => {
    const html = renderToStaticMarkup(<FinanceGroupDetailView group={group} onAddMember={() => true} onDeleteMember={() => undefined} onDeleteGroup={() => undefined} />);

    expect(html).toContain("Thêm thành viên");
    expect(html).toContain("Xóa nhóm");
  });

  it("hides owner-only controls for member", () => {
    const memberGroup = { ...group, currentUserRole: "MEMBER" as const };
    const html = renderToStaticMarkup(<FinanceGroupDetailView group={memberGroup} onAddMember={() => true} onDeleteMember={() => undefined} onDeleteGroup={() => undefined} />);

    expect(html).not.toContain("Thêm thành viên");
    expect(html).not.toContain("Xóa nhóm");
  });

  it("renders selected member dashboard and owner delete actions", () => {
    const html = renderToStaticMarkup(<FinanceMemberDashboard dashboard={dashboard} canDelete={true} onDeleteExpense={() => undefined} onDeleteBudget={() => undefined} />);

    expect(html).toContain("Đang xem nội dung Finance của An");
    expect(html).toContain("Highlands");
    expect(html).toContain("Xóa khoản chi");
  });
});
