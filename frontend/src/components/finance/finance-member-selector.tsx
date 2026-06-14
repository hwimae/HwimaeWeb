"use client";

import { Button } from "@heroui/react";
import React from "react";

import type { FinanceGroupMember } from "../../types/finance";

type FinanceMemberSelectorProps = {
  members: FinanceGroupMember[];
  selectedMemberUserId: string | null;
  onSelectMember: (memberUserId: string) => void;
};

export function FinanceMemberSelector({ members, selectedMemberUserId, onSelectMember }: FinanceMemberSelectorProps) {
  return (
    <section className="card section-stack" aria-label="Chọn thành viên để xem Finance">
      <h3>Thành viên</h3>
      <ul className="app-nav" aria-label="Danh sách thành viên nhóm">
        {members.map((member) => (
          <li key={member.userId}>
            <Button type="button" color="primary" variant={selectedMemberUserId === member.userId ? "solid" : "flat"} onPress={() => onSelectMember(member.userId)}>
              {member.name}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
