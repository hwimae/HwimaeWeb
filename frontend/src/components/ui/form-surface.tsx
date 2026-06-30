import { Card, CardBody } from "@heroui/react";
import clsx from "clsx";
import React, { type ComponentProps, type PropsWithChildren } from "react";

type FormSurfaceProps = PropsWithChildren<
  ComponentProps<typeof Card> & {
    bodyClassName?: string;
  }
>;

export function FormSurface({ children, className, bodyClassName, shadow = "sm", ...cardProps }: FormSurfaceProps) {
  return (
    <Card {...cardProps} className={clsx("form-surface", className)} shadow={shadow}>
      <CardBody className={clsx("form-surface-body", bodyClassName)}>{children}</CardBody>
    </Card>
  );
}
