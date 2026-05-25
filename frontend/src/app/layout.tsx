import type { Metadata } from "next";
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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
