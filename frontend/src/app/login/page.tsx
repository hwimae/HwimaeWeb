"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { FormField } from "@/components/ui/form-field";
import { PageShell } from "@/components/ui/page-shell";
import { StatusMessage } from "@/components/ui/status-message";
import { apiPost } from "@/lib/api";
import { parseAuthResponse, saveAccessToken } from "@/lib/auth";


export default function LoginPage() {
  const router = useRouter();
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
      router.push("/stories");
    } catch {
      setError("Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
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
      <form onSubmit={handleSubmit} className="card">
        <div className="section-stack">
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

          <div
            id={errorRegionId}
            ref={errorRegionRef}
            aria-live="assertive"
            aria-atomic="true"
            tabIndex={-1}
          >
            {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}
          </div>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </div>
      </form>
    </PageShell>
  );
}
