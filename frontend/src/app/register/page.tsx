"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { apiPost } from "@/lib/api";
import { parseAuthResponse, saveAccessToken } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const errorRegionRef = useRef<HTMLParagraphElement>(null);
  const errorRegionId = "register-form-error";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await apiPost(
        "/auth/register",
        { name, email, password },
        undefined,
        parseAuthResponse,
      );

      saveAccessToken(response.accessToken);
      router.push("/");
    } catch {
      setError("Đăng ký thất bại. Vui lòng thử lại.");
      requestAnimationFrame(() => {
        errorRegionRef.current?.focus();
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main>
      <h1>Đăng ký</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Họ tên</label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            aria-describedby={error ? errorRegionId : undefined}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>

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
            autoComplete="new-password"
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
          {isSubmitting ? "Đang đăng ký..." : "Đăng ký"}
        </button>
      </form>
    </main>
  );
}
