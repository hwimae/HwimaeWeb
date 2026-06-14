import { Button, Card, CardBody, CardHeader, Link } from "@heroui/react";
import NextLink from "next/link";

import { ModuleCard } from "@/components/ui/module-card";

const MODULES = [
  {
    href: "/stories",
    label: "Truyện",
    title: "Khám phá truyện phù hợp",
    description: "Tìm truyện, đọc nội dung đã nhập và viết review để hệ thống hiểu gu của bạn hơn.",
    cta: "Mở khu truyện",
  },
  {
    href: "/finance/dashboard",
    label: "Tài chính",
    title: "Theo dõi tài chính cá nhân",
    description: "Xem chi tiêu, ngân sách và các danh mục tài chính trong một giao diện gọn gàng.",
    cta: "Xem tài chính",
  },
  {
    href: "/movie",
    label: "Phim",
    title: "Không gian phim",
    description: "Khu vực dành cho các tính năng phim sẽ được hoàn thiện sau.",
    cta: "Xem phim",
    status: "Đang hoàn thiện" as const,
  },
];

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero-panel landing-hero">
        <div className="section-stack">
          <p className="eyebrow">Nền tảng cá nhân của boo</p>
          <h1>Gợi ý truyện, quản lý tài chính và mở rộng module trong một giao diện xanh biển.</h1>
          <p>
            StoryRec giúp bạn khám phá truyện phù hợp, lưu review và dùng các module cá nhân với trải nghiệm đơn giản, dễ nhìn.
          </p>
          <div className="form-actions">
            <Button as={NextLink} href="/stories" color="primary" size="lg">
              Khám phá truyện
            </Button>
            <Button as={NextLink} href="/modules" color="primary" variant="flat" size="lg">
              Xem module
            </Button>
          </div>
        </div>
        <Card className="landing-preview" shadow="sm">
          <CardHeader>
            <h2>Điểm nhấn</h2>
          </CardHeader>
          <CardBody className="section-stack">
            <p>Giao diện thống nhất bằng HeroUI.</p>
            <p>Màu chủ đạo xanh nước biển.</p>
            <p>Giữ nguyên dữ liệu và API hiện có.</p>
          </CardBody>
        </Card>
      </section>

      <section className="section-stack" aria-labelledby="home-modules-title">
        <div className="section-stack">
          <h2 id="home-modules-title">Các khu vực chính</h2>
          <p className="result-summary">Chọn module bạn muốn sử dụng.</p>
        </div>
        <div className="module-grid">
          {MODULES.map((module) => (
            <ModuleCard key={module.href} {...module} />
          ))}
        </div>
        <Link as={NextLink} href="/recommendations" color="primary">
          Dùng AI tư vấn truyện →
        </Link>
      </section>
    </main>
  );
}
