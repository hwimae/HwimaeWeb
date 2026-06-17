"use client";

import { Button, Card, CardBody, CardHeader, Chip } from "@heroui/react";
import { useEffect, useRef, useState } from "react";

import { PageShell } from "@/components/ui/page-shell";
import { PageState } from "@/components/ui/page-state";
import { StatusMessage } from "@/components/ui/status-message";
import { approveAdminUser, listPendingAdminUsers, rejectAdminUser, type AdminUser } from "@/lib/admin-api";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [isActionPending, setIsActionPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(false);
  const isActionPendingRef = useRef(false);
  const loadRequestIdRef = useRef(0);

  async function loadUsers() {
    const requestId = ++loadRequestIdRef.current;

    setIsLoading(true);
    setError(null);

    try {
      const pendingUsers = await listPendingAdminUsers();

      if (!isMountedRef.current || requestId !== loadRequestIdRef.current) {
        return;
      }

      setUsers(pendingUsers);
    } catch (loadError) {
      if (!isMountedRef.current || requestId !== loadRequestIdRef.current) {
        return;
      }

      setError(loadError instanceof Error ? loadError.message : "Không thể tải danh sách tài khoản chờ duyệt.");
    } finally {
      if (isMountedRef.current && requestId === loadRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }

  useEffect(() => {
    isMountedRef.current = true;
    void loadUsers();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  async function handleApprove(userId: string) {
    if (isActionPendingRef.current) {
      return;
    }

    isActionPendingRef.current = true;
    setIsActionPending(true);
    setActionUserId(userId);
    setError(null);

    try {
      await approveAdminUser(userId);
      await loadUsers();
    } catch (approveError) {
      if (isMountedRef.current) {
        setError(approveError instanceof Error ? approveError.message : "Không thể duyệt tài khoản.");
      }
    } finally {
      isActionPendingRef.current = false;

      if (isMountedRef.current) {
        setIsActionPending(false);
        setActionUserId(null);
      }
    }
  }

  async function handleReject(userId: string) {
    if (isActionPendingRef.current) {
      return;
    }

    isActionPendingRef.current = true;
    setIsActionPending(true);
    setActionUserId(userId);
    setError(null);

    try {
      await rejectAdminUser(userId);
      await loadUsers();
    } catch (rejectError) {
      if (isMountedRef.current) {
        setError(rejectError instanceof Error ? rejectError.message : "Không thể từ chối tài khoản.");
      }
    } finally {
      isActionPendingRef.current = false;

      if (isMountedRef.current) {
        setIsActionPending(false);
        setActionUserId(null);
      }
    }
  }

  return (
    <PageShell
      title="Duyệt tài khoản"
      description="Duyệt hoặc từ chối các tài khoản mới đăng ký."
      eyebrow="Admin workspace"
      variant="workspace"
    >
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

        {!isLoading && users.length === 0 ? (
          <PageState
            tone="empty"
            title="Không có tài khoản đang chờ duyệt"
            description="Khi có người dùng mới đăng ký, tài khoản sẽ xuất hiện tại đây để admin duyệt."
          />
        ) : null}

        {users.length > 0 ? (
          <section className="section-stack" aria-labelledby="pending-admin-users-heading">
            <h2 id="pending-admin-users-heading" className="sr-only">
              Danh sách tài khoản chờ duyệt
            </h2>
            <ul className="card-grid" role="list">
              {users.map((user) => (
                <li key={user.id}>
                  <Card className="glass-card" shadow="sm">
                    <CardHeader className="section-stack">
                      <Chip color="warning" variant="flat">
                        {user.status}
                      </Chip>
                      <h3>{user.name}</h3>
                      <p className="story-meta">{user.email}</p>
                    </CardHeader>
                    <CardBody className="section-stack">
                      <p className="story-meta">Ngày đăng ký: {new Date(user.createdAt).toLocaleString("vi-VN")}</p>
                      <div className="form-actions">
                        <Button
                          color="primary"
                          isLoading={actionUserId === user.id}
                          isDisabled={isActionPending && actionUserId !== user.id}
                          onPress={() => void handleApprove(user.id)}
                        >
                          Duyệt
                        </Button>
                        <Button
                          color="danger"
                          variant="flat"
                          isLoading={actionUserId === user.id}
                          isDisabled={isActionPending && actionUserId !== user.id}
                          onPress={() => void handleReject(user.id)}
                        >
                          Từ chối
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </PageShell>
  );
}
