import type { Metadata } from "next";

import { AuthGate } from "@/components/auth/auth-gate";
import { GlobalHeader } from "@/components/ui/global-header";
import { Providers } from "@/components/ui/providers";

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
        <Providers>
          <AuthGate>
            <GlobalHeader />
            {children}
          </AuthGate>
        </Providers>
      </body>
    </html>
  );
}
