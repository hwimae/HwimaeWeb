import { Card, CardBody, CardFooter, CardHeader, Chip, Link } from "@heroui/react";
import NextLink from "next/link";
import React from "react";

type ModuleCardProps = {
  href: string;
  label: string;
  title: string;
  description: string;
  cta: string;
  status?: "Sẵn sàng" | "Đang hoàn thiện";
};

export function ModuleCard({
  href,
  label,
  title,
  description,
  cta,
  status = "Sẵn sàng",
}: ModuleCardProps) {
  return (
    <Card as="article" className="module-card" shadow="sm">
      <CardHeader className="module-card-header">
        <Chip color="primary" variant="flat">
          {label}
        </Chip>
        <Chip color={status === "Sẵn sàng" ? "success" : "warning"} variant="flat">
          {status}
        </Chip>
      </CardHeader>
      <CardBody className="section-stack">
        <h2>{title}</h2>
        <p>{description}</p>
      </CardBody>
      <CardFooter>
        <Link as={NextLink} href={href} color="primary" className="module-card-cta">
          {cta} →
        </Link>
      </CardFooter>
    </Card>
  );
}
