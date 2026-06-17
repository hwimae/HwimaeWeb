"use client";

import React, { useState } from "react";

import type { FinanceGroupDetail } from "../../types/finance";

type FinanceGroupDetailViewProps = {
  group: FinanceGroupDetail;
  onAddMember: (email: string) => Promise<boolean> | boolean;
  onDeleteMember: (memberUserId: string) => void;
  onDeleteGroup: () => void;
};

export function FinanceGroupDetailView({ group, onAddMember, onDeleteMember, onDeleteGroup }: FinanceGroupDetailViewProps) {
  const [email, setEmail] = useState("");
  const isOwner = group.currentUserRole === "OWNER";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    const didAdd = await onAddMember(trimmed);
    if (didAdd) setEmail("");
  }

  return (
    <section className="workspace-card section-stack" aria-label="Chi tiết nhóm tài chính">
      <h2>{group.name}</h2>
      <p>
        {group.memberCount} thành viên · {isOwner ? "Bạn là chủ nhóm" : "Bạn là thành viên"}
      </p>
      <ul>
        {group.members.map((member) => (
          <li key={member.userId}>
            {member.name} ({member.email}) · {member.role === "OWNER" ? "Chủ nhóm" : "Thành viên"}
            {isOwner && member.role !== "OWNER" ? (
              <button type="button" aria-label={`Xóa thành viên ${member.name}`} onClick={() => onDeleteMember(member.userId)}>
                Xóa thành viên {member.name}
              </button>
            ) : null}
          </li>
        ))}
      </ul>
      {isOwner ? (
        <>
          <form className="section-stack" onSubmit={handleSubmit}>
            <label className="form-field" htmlFor="finance-group-member-email">
              <span>Email thành viên</span>
              <input id="finance-group-member-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <button type="submit">Thêm thành viên</button>
          </form>
          <button type="button" onClick={onDeleteGroup}>
            Xóa nhóm
          </button>
        </>
      ) : null}
    </section>
  );
}
