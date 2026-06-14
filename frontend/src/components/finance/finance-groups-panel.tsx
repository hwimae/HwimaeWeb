"use client";

import { Button } from "@heroui/react";
import React, { useState } from "react";

import type { FinanceGroupSummary } from "../../types/finance";
import { StatusMessage } from "../ui/status-message";

type FinanceGroupsPanelProps = {
  groups: FinanceGroupSummary[];
  selectedGroupId: string | null;
  isLoading: boolean;
  onSelectGroup: (groupId: string) => void;
  onCreateGroup: (name: string) => Promise<boolean> | boolean;
};

export function FinanceGroupsPanel({ groups, selectedGroupId, isLoading, onSelectGroup, onCreateGroup }: FinanceGroupsPanelProps) {
  const [name, setName] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const didCreate = await onCreateGroup(trimmed);
    if (didCreate) setName("");
  }

  return (
    <aside className="card section-stack" aria-label="Danh sách nhóm tài chính">
      <h2>Nhóm của tôi</h2>
      {isLoading ? <StatusMessage>Đang tải danh sách nhóm tài chính...</StatusMessage> : null}
      {!isLoading && groups.length === 0 ? <StatusMessage>Bạn chưa tham gia nhóm tài chính nào.</StatusMessage> : null}
      <div className="section-stack">
        {groups.map((group) => (
          <Button key={group.id} type="button" color="primary" variant={selectedGroupId === group.id ? "solid" : "flat"} onPress={() => onSelectGroup(group.id)}>
            {group.name} · {group.currentUserRole === "OWNER" ? "Chủ nhóm" : "Thành viên"}
          </Button>
        ))}
      </div>
      <form className="section-stack" onSubmit={handleSubmit}>
        <label className="form-field" htmlFor="finance-group-name">
          <span>Tên nhóm</span>
          <input id="finance-group-name" value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <button type="submit">{groups.length === 0 ? "Tạo nhóm đầu tiên" : "Tạo nhóm"}</button>
      </form>
    </aside>
  );
}
