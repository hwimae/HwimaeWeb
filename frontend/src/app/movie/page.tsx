import { Card, CardBody, CardHeader, Chip } from "@heroui/react";

import { PageShell } from "@/components/ui/page-shell";

export default function MoviePage() {
  return (
    <PageShell
      title="Phim"
      description="Khu vực phim đã có giao diện chung và sẵn sàng để bổ sung tính năng trong các bước sau."
    >
      <Card className="section-stack" shadow="sm">
        <CardHeader className="section-stack">
          <Chip color="primary" variant="flat">
            Đang hoàn thiện
          </Chip>
          <h2>Không gian phim</h2>
        </CardHeader>
        <CardBody>
          <p className="result-summary">
            Module này hiện là khung giao diện. Khi có dữ liệu phim, có thể tái sử dụng card, chip và shell chung đã tạo.
          </p>
        </CardBody>
      </Card>
    </PageShell>
  );
}
