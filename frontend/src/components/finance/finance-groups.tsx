"use client";

import React, { useEffect, useRef, useState } from "react";

import {
  addFinanceGroupMember,
  createFinanceGroup,
  deleteFinanceGroup,
  deleteFinanceGroupMember,
  deleteFinanceGroupMemberBudget,
  deleteFinanceGroupMemberExpense,
  getFinanceGroup,
  getFinanceGroupMemberDashboard,
  listFinanceGroups,
} from "../../lib/finance-api";
import type { FinanceGroupDetail, FinanceGroupMemberDashboard, FinanceGroupSummary } from "../../types/finance";
import { StatusMessage } from "../ui/status-message";
import { FinanceGroupDetailView } from "./finance-group-detail";
import { FinanceGroupsPanel } from "./finance-groups-panel";
import { FinanceMemberDashboard } from "./finance-member-dashboard";
import { FinanceMemberSelector } from "./finance-member-selector";

type GroupsState = {
  groups: FinanceGroupSummary[];
  selectedGroup: FinanceGroupDetail | null;
  selectedMemberUserId: string | null;
  dashboard: FinanceGroupMemberDashboard | null;
  isLoading: boolean;
  isLoadingGroupDetail: boolean;
  isLoadingDashboard: boolean;
  error: string | null;
  message: string | null;
};

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export function FinanceGroups() {
  const requestIdRef = useRef(0);
  const [state, setState] = useState<GroupsState>({
    groups: [],
    selectedGroup: null,
    selectedMemberUserId: null,
    dashboard: null,
    isLoading: true,
    isLoadingGroupDetail: false,
    isLoadingDashboard: false,
    error: null,
    message: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    async function loadInitialGroups() {
      const groups = await listFinanceGroups({ signal: controller.signal });
      const selectedGroup = groups[0] ? await getFinanceGroup(groups[0].id, { signal: controller.signal }) : null;
      if (requestIdRef.current !== requestId) return;
      setState((current) => ({ ...current, groups, selectedGroup, selectedMemberUserId: null, dashboard: null, isLoading: false, isLoadingGroupDetail: false, isLoadingDashboard: false, error: null }));
    }

    loadInitialGroups().catch((error) => {
      if (isAbortError(error) || requestIdRef.current !== requestId) return;
      setState((current) => ({ ...current, isLoading: false, isLoadingGroupDetail: false, isLoadingDashboard: false, error: error instanceof Error ? error.message : "Không thể tải danh sách nhóm tài chính." }));
    });
    return () => controller.abort();
  }, []);

  async function selectGroup(groupId: string) {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setState((current) => ({ ...current, selectedGroup: null, selectedMemberUserId: null, dashboard: null, isLoadingGroupDetail: true, isLoadingDashboard: false, error: null, message: null }));
    try {
      const selectedGroup = await getFinanceGroup(groupId);
      if (requestIdRef.current !== requestId) return;
      setState((current) => ({ ...current, selectedGroup, selectedMemberUserId: null, dashboard: null, isLoadingGroupDetail: false, isLoadingDashboard: false, error: null, message: null }));
    } catch (error) {
      if (requestIdRef.current !== requestId) return;
      setState((current) => ({ ...current, isLoadingGroupDetail: false, isLoadingDashboard: false, error: error instanceof Error ? error.message : "Không thể tải chi tiết nhóm tài chính." }));
    }
  }

  async function selectMember(memberUserId: string) {
    if (!state.selectedGroup) return;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const groupId = state.selectedGroup.id;
    setState((current) => ({ ...current, selectedMemberUserId: memberUserId, dashboard: null, isLoadingDashboard: true, error: null }));
    try {
      const dashboard = await getFinanceGroupMemberDashboard(groupId, memberUserId);
      if (requestIdRef.current !== requestId) return;
      setState((current) => {
        if (current.selectedGroup?.id !== groupId || current.selectedMemberUserId !== memberUserId) return current;
        return { ...current, selectedMemberUserId: memberUserId, dashboard, isLoadingGroupDetail: false, isLoadingDashboard: false, error: null };
      });
    } catch (error) {
      if (requestIdRef.current !== requestId) return;
      setState((current) => {
        if (current.selectedGroup?.id !== groupId || current.selectedMemberUserId !== memberUserId) return current;
        return { ...current, isLoadingGroupDetail: false, isLoadingDashboard: false, error: error instanceof Error ? error.message : "Không thể tải dashboard của thành viên này." };
      });
    }
  }

  async function createGroup(name: string): Promise<boolean> {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    try {
      const selectedGroup = await createFinanceGroup({ name });
      const groups = await listFinanceGroups();
      if (requestIdRef.current !== requestId) return false;
      setState((current) => ({ ...current, groups, selectedGroup, selectedMemberUserId: null, dashboard: null, isLoadingGroupDetail: false, isLoadingDashboard: false, error: null, message: "Đã tạo nhóm tài chính." }));
      return true;
    } catch (error) {
      if (requestIdRef.current !== requestId) return false;
      setState((current) => ({ ...current, error: error instanceof Error ? error.message : "Không thể tạo nhóm tài chính." }));
      return false;
    }
  }

  async function refreshSelectedGroup(groupId: string, memberUserId: string | null): Promise<boolean> {
    setState((current) => (current.selectedGroup?.id === groupId ? { ...current, isLoadingGroupDetail: true, error: null } : current));

    const selectedGroup = await getFinanceGroup(groupId);
    const memberStillExists = selectedGroup.members.some((member) => member.userId === memberUserId);
    const nextMemberUserId = memberStillExists ? memberUserId : null;
    let didApplyGroup = false;

    setState((current) => {
      if (current.selectedGroup?.id !== groupId) return current;
      didApplyGroup = true;
      return { ...current, selectedGroup, selectedMemberUserId: nextMemberUserId, dashboard: null, isLoadingGroupDetail: false, isLoadingDashboard: Boolean(nextMemberUserId), error: null };
    });

    if (!didApplyGroup || !nextMemberUserId) return didApplyGroup;

    try {
      const dashboard = await getFinanceGroupMemberDashboard(selectedGroup.id, nextMemberUserId);
      setState((current) => {
        if (current.selectedGroup?.id !== groupId || current.selectedMemberUserId !== nextMemberUserId) return current;
        return { ...current, dashboard, isLoadingGroupDetail: false, isLoadingDashboard: false, error: null };
      });
      return true;
    } catch (error) {
      setState((current) => {
        if (current.selectedGroup?.id !== groupId || current.selectedMemberUserId !== nextMemberUserId) return current;
        return { ...current, isLoadingGroupDetail: false, isLoadingDashboard: false, error: error instanceof Error ? error.message : "Không thể tải dashboard của thành viên này." };
      });
      return false;
    }
  }

  async function addMember(email: string): Promise<boolean> {
    if (!state.selectedGroup) return false;
    const groupId = state.selectedGroup.id;
    const memberUserId = state.selectedMemberUserId;

    try {
      await addFinanceGroupMember(groupId, { email });
      const didRefresh = await refreshSelectedGroup(groupId, memberUserId);
      if (!didRefresh) return false;
      setState((current) => ({ ...current, error: null, message: "Đã thêm thành viên." }));
      return true;
    } catch (error) {
      setState((current) => ({ ...current, isLoadingGroupDetail: false, isLoadingDashboard: false, error: error instanceof Error ? error.message : "Không thể thêm thành viên." }));
      return false;
    }
  }

  async function removeMember(memberUserId: string) {
    if (!state.selectedGroup || !window.confirm("Bạn chắc chắn muốn xóa thành viên này khỏi nhóm?")) return;
    const groupId = state.selectedGroup.id;
    const nextSelectedMemberUserId = state.selectedMemberUserId === memberUserId ? null : state.selectedMemberUserId;

    try {
      await deleteFinanceGroupMember(groupId, memberUserId);
      const didRefresh = await refreshSelectedGroup(groupId, nextSelectedMemberUserId);
      if (!didRefresh) return;
      setState((current) => ({ ...current, error: null, message: "Đã xóa thành viên khỏi nhóm." }));
    } catch (error) {
      setState((current) => ({ ...current, isLoadingGroupDetail: false, isLoadingDashboard: false, error: error instanceof Error ? error.message : "Không thể xóa thành viên." }));
    }
  }

  async function removeGroup() {
    if (!state.selectedGroup || !window.confirm(`Bạn chắc chắn muốn xóa nhóm ${state.selectedGroup.name}?`)) return;
    const groupId = state.selectedGroup.id;

    try {
      await deleteFinanceGroup(groupId);
      const groups = await listFinanceGroups();
      const fallbackGroup = groups[0] ? await getFinanceGroup(groups[0].id) : null;
      setState((current) => {
        if (current.selectedGroup?.id !== groupId) {
          return { ...current, groups, error: null, message: "Đã xóa nhóm tài chính." };
        }

        return { ...current, groups, selectedGroup: fallbackGroup, selectedMemberUserId: null, dashboard: null, isLoadingGroupDetail: false, isLoadingDashboard: false, error: null, message: "Đã xóa nhóm tài chính." };
      });
    } catch (error) {
      setState((current) => ({ ...current, isLoadingGroupDetail: false, isLoadingDashboard: false, error: error instanceof Error ? error.message : "Không thể xóa nhóm tài chính." }));
    }
  }

  async function deleteExpense(expenseId: string) {
    if (!state.selectedGroup || !state.selectedMemberUserId || !state.dashboard || !window.confirm(`Bạn chắc chắn muốn xóa khoản này khỏi dữ liệu của ${state.dashboard.member.name}?`)) return;
    const groupId = state.selectedGroup.id;
    const memberUserId = state.selectedMemberUserId;
    setState((current) => ({ ...current, isLoadingDashboard: current.selectedGroup?.id === groupId, error: null }));

    try {
      await deleteFinanceGroupMemberExpense(groupId, memberUserId, expenseId);
      const didRefresh = await refreshSelectedGroup(groupId, memberUserId);
      if (!didRefresh) return;
      setState((current) => ({ ...current, error: null, message: "Đã xóa khoản chi." }));
    } catch (error) {
      setState((current) => ({ ...current, isLoadingGroupDetail: false, isLoadingDashboard: false, error: error instanceof Error ? error.message : "Không thể xóa khoản chi." }));
    }
  }

  async function deleteBudget(budgetId: string) {
    if (!state.selectedGroup || !state.selectedMemberUserId || !state.dashboard || !window.confirm(`Bạn chắc chắn muốn xóa ngân sách này khỏi dữ liệu của ${state.dashboard.member.name}?`)) return;
    const groupId = state.selectedGroup.id;
    const memberUserId = state.selectedMemberUserId;
    setState((current) => ({ ...current, isLoadingDashboard: current.selectedGroup?.id === groupId, error: null }));

    try {
      await deleteFinanceGroupMemberBudget(groupId, memberUserId, budgetId);
      const didRefresh = await refreshSelectedGroup(groupId, memberUserId);
      if (!didRefresh) return;
      setState((current) => ({ ...current, error: null, message: "Đã xóa ngân sách." }));
    } catch (error) {
      setState((current) => ({ ...current, isLoadingGroupDetail: false, isLoadingDashboard: false, error: error instanceof Error ? error.message : "Không thể xóa ngân sách." }));
    }
  }

  return (
    <section className="finance-groups-layout" aria-label="Workspace nhóm tài chính">
      {state.error || state.message ? (
        <div className="finance-groups-status-stack">
          {state.error ? <StatusMessage tone="error">{state.error}</StatusMessage> : null}
          {state.message ? <StatusMessage tone="success">{state.message}</StatusMessage> : null}
        </div>
      ) : null}

      <FinanceGroupsPanel groups={state.groups} selectedGroupId={state.selectedGroup?.id ?? null} isLoading={state.isLoading} onSelectGroup={selectGroup} onCreateGroup={createGroup} />

      <div className="finance-groups-main section-stack">
        {state.isLoadingGroupDetail ? (
          <section className="workspace-card section-stack">
            <StatusMessage>Đang tải chi tiết nhóm tài chính...</StatusMessage>
          </section>
        ) : null}

        {state.selectedGroup && !state.isLoadingGroupDetail ? (
          <>
            <FinanceGroupDetailView group={state.selectedGroup} onAddMember={addMember} onDeleteMember={removeMember} onDeleteGroup={removeGroup} />
            <FinanceMemberSelector members={state.selectedGroup.members} selectedMemberUserId={state.selectedMemberUserId} onSelectMember={selectMember} />
          </>
        ) : null}

        {state.selectedGroup && state.isLoadingDashboard ? (
          <section className="workspace-card section-stack">
            <StatusMessage>Đang tải nội dung Finance của thành viên...</StatusMessage>
          </section>
        ) : null}

        {state.selectedGroup && !state.dashboard && !state.isLoadingDashboard ? (
          <section className="workspace-card section-stack">
            <StatusMessage>Chọn tên một thành viên để xem nội dung Finance của người đó.</StatusMessage>
          </section>
        ) : null}

        {state.dashboard ? <FinanceMemberDashboard dashboard={state.dashboard} canDelete={state.selectedGroup?.currentUserRole === "OWNER"} onDeleteExpense={deleteExpense} onDeleteBudget={deleteBudget} /> : null}
      </div>
    </section>
  );
}
