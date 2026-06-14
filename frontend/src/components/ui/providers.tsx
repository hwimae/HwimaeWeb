"use client";

import { HeroUIProvider } from "@heroui/react";
import { useRouter } from "next/navigation";
import React, { type ReactNode } from "react";

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  const router = useRouter();

  return <HeroUIProvider navigate={router.push}>{children}</HeroUIProvider>;
}
