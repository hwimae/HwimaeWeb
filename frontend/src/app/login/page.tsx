"use client";

import { Button, Card, CardBody, CardHeader } from "@heroui/react";
import { FormEvent, Suspense, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { FormField } from "@/components/ui/form-field";
import { PageShell } from "@/components/ui/page-shell";
import { StatusMessage } from "@/components/ui/status-message";
import { ApiError, apiPost } from "@/lib/api";
import { parseAuthResponse, saveAccessToken } from "@/lib/auth";

function getLoginErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.message === "Account pending approval") {
      return "Tài khoản đang chờ admin duyệt.";
    }

    if (error.message === "Account rejected") {
      return "Tài khoản đã bị từ chối.";
    }
  }

  return "Email hoặc mật khẩu không đúng.";
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registeredPending = searchParams.get("registered") === "pending";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const errorRegionRef = useRef<HTMLDivElement>(null);
  const errorRegionId = "login-form-error";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await apiPost(
        "/auth/login",
        { email, password },
        undefined,
        parseAuthResponse,
      );

      saveAccessToken(response.accessToken);
      router.replace("/stories");
    } catch (submitError) {
      setError(getLoginErrorMessage(submitError));
      requestAnimationFrame(() => {
        errorRegionRef.current?.focus();
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageShell
      title="Đăng nhập"
      description="Đăng nhập để viết review, nhận gợi ý và dùng tính năng tài chính."
    >
      <Card className="auth-card" shadow="sm">
        <CardHeader>
          <h2>Chào mừng quay lại</h2>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="section-stack">
            <FormField
              id="email"
              name="email"
              type="email"
              label="Email"
              autoComplete="email"
              required
              aria-describedby={error ? errorRegionId : undefined}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />

            <FormField
              id="password"
              name="password"
              type="password"
              label="Mật khẩu"
              autoComplete="current-password"
              required
              aria-describedby={error ? errorRegionId : undefined}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />

            {registeredPending ? (
              <StatusMessage tone="success">Đăng ký thành công. Vui lòng chờ admin duyệt tài khoản.</StatusMessage>
            ) : null}

            <div id={errorRegionId} ref={errorRegionRef} aria-live="assertive" aria-atomic="true" tabIndex={-1}>
              {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}
            </div>

            <Button color="primary" type="submit" isLoading={isSubmitting}>
              {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </form>
        </CardBody>
      </Card>
    </PageShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <PageShell title="Đăng nhập" description="Đang chuẩn bị trang đăng nhập.">
          <StatusMessage>Đang tải trang đăng nhập...</StatusMessage>
        </PageShell>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
