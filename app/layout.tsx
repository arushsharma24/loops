import "./globals.css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Loops",
  description: "A personal command center for threads of intent.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
