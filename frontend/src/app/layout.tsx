import type { Metadata } from "next";

import { GlobalHeader } from "@/components/ui/global-header";

import "./globals.css";

export const metadata: Metadata = {
  title: "Story Recommendation Platform",
  description: "Story browsing shell for the story recommendation platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>
        <GlobalHeader />
        {children}
      </body>
    </html>
  );
}
