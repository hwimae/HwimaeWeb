"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { apiPost } from "@/lib/api";
import { parseAuthResponse, saveAccessToken } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const errorRegionRef = useRef<HTMLParagraphElement>(null);
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
      router.push("/");
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
    <main>
      <h1>Đăng nhập</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-describedby={error ? errorRegionId : undefined}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="password">Mật khẩu</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            aria-describedby={error ? errorRegionId : undefined}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        <p
          id={errorRegionId}
          ref={errorRegionRef}
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          tabIndex={-1}
        >
          {error ?? ""}
        </p>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>
    </main>
  );
}
