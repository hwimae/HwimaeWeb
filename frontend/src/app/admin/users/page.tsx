"use client";

import { Button, Card, CardBody, CardHeader, Chip } from "@heroui/react";
import { useEffect, useState } from "react";

import { PageShell } from "@/components/ui/page-shell";
import { StatusMessage } from "@/components/ui/status-message";
import { approveAdminUser, listPendingAdminUsers, rejectAdminUser, type AdminUser } from "@/lib/admin-api";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadUsers() {
    setIsLoading(true);
    setError(null);

    try {
      setUsers(await listPendingAdminUsers());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Không thể tải danh sách tài khoản chờ duyệt.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  async function handleApprove(userId: string) {
    setActionUserId(userId);
    setError(null);

    try {
      await approveAdminUser(userId);
      await loadUsers();
    } catch (approveError) {
      setError(approveError instanceof Error ? approveError.message : "Không thể duyệt tài khoản.");
    } finally {
      setActionUserId(null);
    }
  }

  async function handleReject(userId: string) {
    setActionUserId(userId);
    setError(null);

    try {
      await rejectAdminUser(userId);
      await loadUsers();
    } catch (rejectError) {
      setError(rejectError instanceof Error ? rejectError.message : "Không thể từ chối tài khoản.");
    } finally {
      setActionUserId(null);
    }
  }

  return (
    <PageShell title="Duyệt tài khoản" description="Duyệt hoặc từ chối các tài khoản mới đăng ký.">
      <div className="section-stack">
        {isLoading ? <StatusMessage>Đang tải danh sách tài khoản chờ duyệt...</StatusMessage> : null}
        {error ? (
          <StatusMessage tone="error">
            <div className="section-stack">
              <p>{error}</p>
              <Button type="button" color="primary" variant="flat" onPress={() => void loadUsers()}>
                Thử lại
              </Button>
            </div>
          </StatusMessage>
        ) : null}

        {!isLoading && users.length === 0 ? <StatusMessage>Không có tài khoản đang chờ duyệt.</StatusMessage> : null}

        {users.length > 0 ? (
          <div className="card-grid" aria-label="Danh sách tài khoản chờ duyệt">
            {users.map((user) => (
              <Card key={user.id} shadow="sm">
                <CardHeader className="section-stack">
                  <Chip color="warning" variant="flat">
                    {user.status}
                  </Chip>
                  <h2>{user.name}</h2>
                  <p className="story-meta">{user.email}</p>
                </CardHeader>
                <CardBody className="section-stack">
                  <p className="story-meta">Ngày đăng ký: {new Date(user.createdAt).toLocaleString("vi-VN")}</p>
                  <div className="form-actions">
                    <Button color="primary" isLoading={actionUserId === user.id} onPress={() => void handleApprove(user.id)}>
                      Duyệt
                    </Button>
                    <Button color="danger" variant="flat" isLoading={actionUserId === user.id} onPress={() => void handleReject(user.id)}>
                      Từ chối
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : null}
      </div>
    </PageShell>
  );
}
