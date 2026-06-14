import { ModuleCard } from "@/components/ui/module-card";
import { PageShell } from "@/components/ui/page-shell";

const MODULES = [
  {
    href: "/stories",
    label: "Truyện",
    title: "Truyện và review",
    description: "Duyệt truyện, đọc nội dung, viết review và nhận gợi ý phù hợp.",
    cta: "Mở truyện",
  },
  {
    href: "/finance/dashboard",
    label: "Tài chính",
    title: "Tài chính cá nhân",
    description: "Theo dõi chi tiêu, ngân sách, danh mục và giao dịch gần đây.",
    cta: "Mở tài chính",
  },
  {
    href: "/movie",
    label: "Phim",
    title: "Phim",
    description: "Không gian cho tính năng phim trong các bước phát triển tiếp theo.",
    cta: "Mở phim",
    status: "Đang hoàn thiện" as const,
  },
];

export default function ModulesPage() {
  return (
    <PageShell title="Module" description="Tất cả khu vực chức năng đang có trong dự án.">
      <div className="module-grid">
        {MODULES.map((module) => (
          <ModuleCard key={module.href} {...module} />
        ))}
      </div>
    </PageShell>
  );
}
