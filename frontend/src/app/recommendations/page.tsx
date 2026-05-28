import Link from "next/link";
import { StoryAdvisorForm } from "@/components/story-advisor-form";

export const dynamic = "force-dynamic";

export default function RecommendationsPage() {
  return (
    <main>
      <header className="header">
        <div>
          <h1>AI tư vấn truyện</h1>
          <p>Nhập gu đọc truyện của bạn để hệ thống tìm truyện liên quan từ nội dung đã index.</p>
        </div>
        <nav className="auth-links">
          <Link href="/">Trang chủ</Link>
        </nav>
      </header>
      <StoryAdvisorForm />
    </main>
  );
}
