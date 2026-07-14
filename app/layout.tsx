import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "Codex Rule Ledger — Evidence, not compliance",
  description:
    "Reconstruct a captured Codex instruction chain and inspect evidence-bound obligation results.",
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f2eee2",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
